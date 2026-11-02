"""Export presentation-only states from all passing fresh audit records.

No controller or dynamics are rerun. Original float precision is retained.
Only state, applied command, outcome and display metadata are exported.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--study', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
study, output = args.study, args.output
sha = lambda b: hashlib.sha256(b).hexdigest()
analysis = json.loads((study/'analysis.json').read_text())
assert analysis['audits_passed'] and analysis['all_episodes'] == 576
audits = {}
for name in ['feedback-verification.json', 'planner-verification.json']:
    a = json.loads((study/name).read_text()); assert a['all_passed']
    for record in a['records']:
        assert record['passed']; audits[record['trial_id']] = record
rows = json.loads((study/'summary.json').read_text())
assert len(rows) == len(audits) == 576
by_case = {}
for row in rows: by_case.setdefault(row['case'], {})[row['method']] = row
output.mkdir(parents=True, exist_ok=True)
index, provenance = [], []
methods = [('integral', 'integral-feedback'), ('planner', 'capped-predictive'), ('pd', 'pd-feedback')]
for key in sorted(by_case):
    item = {'id': key, 'duration': 7, 'methods': {}}
    for alias, method in methods:
        row = by_case[key][method]
        trial = row['trial_id']; raw = (study/'outcomes'/(trial+'.json.gz')).read_bytes()
        assert sha(raw) == audits[trial]['source_result_sha256']
        result = json.loads(gzip.decompress(raw))
        assert result['summary']['success'] == row['success']
        trace = []
        for q in result['trace']:
            # [time, qpos(9), qvel(8), command(4), xy_distance, attitude_deg]
            trace.append([q['t_s'], *q['qpos'], *q['qvel'], *q['motor_command_n'], q['horizontal_distance_m'], q['attitude_deg']])
        assert all(len(q) == 24 for q in trace)
        item['methods'][alias] = {'success': row['success'], 'failures': row['failures'], 'trace': trace}
        provenance.append({'trial_id':trial,'sha256':sha(raw),'audit_passed':True})
    payload = json.dumps(item,separators=(',',':'),allow_nan=False).encode()
    (output/(key+'.json')).write_bytes(payload)
    index.append({'id':key,'group':row['group'],'world':row['world'],'state':row['state'],
                  'outcomes':{alias:item['methods'][alias]['success'] for alias,_ in methods},'sha256':sha(payload)})
assert len(index) == 192
manifest = {'cases':index,'case_count':192,'episodes':576,'duration':7,'sample_rate_hz':20,
    'columns':['t','x','y','z','qw','qx','qy','qz','front_joint','rear_joint','vx','vy','vz','wx','wy','wz','front_joint_velocity','rear_joint_velocity','rotor_1_command','rotor_2_command','rotor_3_command','rotor_4_command','xy_distance','attitude_deg'],
    'scope':'Complete fresh cohort; all three methods. Curated presentation export, no simulation or state interpolation.',
    'display':'Pose schematic uses recorded body quaternion, joint angles and authored robot dimensions. Reference plane is drawn at starting height; it is not a floor. Last saved pose held after recording end.',
    'summary_sha256':sha((study/'summary.json').read_bytes()),'source_records':provenance}
(output/'index.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
print(json.dumps({'cases':192,'episodes':576,'bytes':sum(p.stat().st_size for p in output.glob('*.json'))}))

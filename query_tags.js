require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://capstone:h29M3JtD7@171.244.205.106:5432/ielts_db' });
async function check() {
  const qt = await pool.query(`select code, name from question_type`);
  const pt = await pool.query(`select code, name from tag where type = 'QUESTION_TYPE'`);
  console.log('--- Question Types ---');
  console.table(qt.rows);
  console.log('--- Tags ---');
  console.table(pt.rows);
  process.exit(0);
}
check();

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/history_std.json', 'utf-8'));

console.log('=== 数据统计分析 ===');
console.log('总题目数:', data.test.length);

const subjectCount = {};
const yearCount = {};
const typeCount = {};

for (const q of data.test) {
    subjectCount[q.subject_id] = (subjectCount[q.subject_id] || 0) + 1;
    const yearMatch = (q.origin || '').match(/(20\d{2})/);
    const year = yearMatch ? yearMatch[1] : 'unknown';
    yearCount[year] = (yearCount[year] || 0) + 1;
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
}

console.log('\n--- 按 subject_id 分布 ---');
const subjects = data.subjects;
for (let i = 1; i <= subjects.length; i++) {
    if (subjectCount[i]) {
        const period = i <= 6 ? '中国古代史' : i <= 16 ? '中国近代史' : i <= 19 ? '中国现代史' : '世界史';
        console.log(i.toString().padStart(2, '0') + ' [' + period + ']: ' + subjectCount[i] + '题 - ' + subjects[i-1]);
    }
}

console.log('\n--- 按年份分布 ---');
const sortedYears = Object.keys(yearCount).sort();
for (const year of sortedYears) {
    console.log(year + ': ' + yearCount[year] + '题');
}

console.log('\n--- 按题型分布 ---');
console.log('0-单选:', typeCount[0] || 0);
console.log('1-填空:', typeCount[1] || 0);
console.log('2-综合:', typeCount[2] || 0);

console.log('\n--- 数据质量检查 ---');
let issues = [];
for (const q of data.test) {
    if (!q.content || q.content.length < 5) {
        issues.push('题目' + q.tid + ': 内容过短');
    }
    if (q.type === 0 && (!q.choices || q.choices.length < 2)) {
        issues.push('题目' + q.tid + ': 单选题缺少选项');
    }
    if (typeof q.ans !== 'number' && typeof q.ans !== 'string') {
        issues.push('题目' + q.tid + ': 答案格式异常');
    }
}
console.log('发现问题数:', issues.length);
if (issues.length > 0) {
    console.log('前10个问题:', issues.slice(0, 10));
}

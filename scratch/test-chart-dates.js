// Test calculation logic for AdminCharts
function testDates() {
  const now = new Date('2026-09-14T11:00:00+07:00');
  
  // 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({ key: `${yyyy}-${mm}-${dd}`, label: `${dd}/${mm}` });
  }
  console.log('Daily count:', days.length, 'first:', days[0], 'last:', days[days.length - 1]);

  // 8 weeks
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - (i * 7));
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const sDD = String(start.getDate()).padStart(2, '0');
    const sMM = String(start.getMonth() + 1).padStart(2, '0');
    const eDD = String(end.getDate()).padStart(2, '0');
    const eMM = String(end.getMonth() + 1).padStart(2, '0');
    weeks.push({
      label: i === 0 ? 'Tuần này' : `${sDD}/${sMM}-${eDD}/${eMM}`,
      start,
      end
    });
  }
  console.log('Weeks count:', weeks.length, 'first:', weeks[0].label, 'last:', weeks[weeks.length - 1].label);

  // 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `Thg ${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`,
      month: d.getMonth() + 1,
      year: d.getFullYear()
    });
  }
  console.log('Months count:', months.length, 'first:', months[0].label, 'last:', months[months.length - 1].label);
}

testDates();

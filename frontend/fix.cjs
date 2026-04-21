const fs = require('fs');
const file = './src/pages/OrganizerDashboard.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/  const handleSidebarClick = \(e\) => \{[\s\S]*?  \};\n\n/, '');

const rStart = c.indexOf('  const renderContent = () => {');
const rEnd = c.indexOf('  };\n        )}\n      </main>');

if (rStart !== -1 && rEnd !== -1) {
  const block = c.substring(rStart, rEnd + 5);
  let c2 = c.substring(0, rStart) + '          renderContent()\n' + c.substring(rEnd + 5);
  c2 = c2.replace(/  return \(\s*<div className="dashboard-layout">/, block + '\n\n  return (\n    <div className="dashboard-layout">');
  fs.writeFileSync(file, c2);
  console.log('Fixed OrganizerDashboard.jsx');
} else {
  console.log('Not found', rStart, rEnd);
}

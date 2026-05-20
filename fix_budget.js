import fs from 'fs';
const content = fs.readFileSync('components/BudgetPanel.tsx', 'utf8');
const lines = content.split('\n');
// The lines are 784 to 788 in the 1-indexed view I saw.
// In 0-indexed that's 783 to 787.
lines.splice(783, 5);
const newLogic = `                    ) : activeTab === 'labor' ? (
                        <LaborView 
                            parts={parts}
                            totalPartsCount={totalPartsCount}
                            totalArea={parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000, 0)}
                            globalConfig={globalConfig}
                            collaborators={collaborators}
                            productionTimes={{
                                corte: materialProdTimeMinutes,
                                bordeamento: edgeBandingTimeMinutes,
                                montagem: hardwareAssemblyTimeMinutes + partsAssemblyTimeMinutes,
                                acabamento: 60 
                            }}
                            subtotal={subtotal}
                        />
                    ) : activeTab === 'materials' ? (`;
lines.splice(783, 0, newLogic);
fs.writeFileSync('components/BudgetPanel.tsx', lines.join('\n'));

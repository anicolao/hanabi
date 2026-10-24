import {test,expect} from '@playwright/test';
test('Minh share link prints exactly 45 cards and switches suits and quantities correctly',async({page})=>{
 await page.goto('/?deck=minh');
 await expect(page.locator('#art-set')).toHaveValue('minh');
 await expect(page.locator('#print-total')).toHaveText('45 cards · 5 sheets · 10 PDF pages');
 await expect(page.locator('#print-pages [data-side=front] .printed-card')).toHaveCount(45);
 for(let rank=1;rank<=5;rank++)await expect(page.locator(`#print-pages [data-side=front] [data-card="multicolour-${rank}"]`)).toHaveCount(1);
 await expect(page.locator('#print-pages [data-card^=white]')).toHaveCount(0);
 await page.locator('#gallery > summary').click();
 await page.getByRole('button',{name:'Multicolour',exact:true}).click();
 await expect(page.locator('#gallery-count')).toHaveText('5 unique fronts · 5 playing cards');
 await expect(page.locator('.card-tile')).toHaveCount(5);
 await page.getByLabel('What to include').selectOption('filtered');
 await expect(page.locator('#print-total')).toHaveText('5 cards · 1 sheet · 2 PDF pages');
 await page.getByLabel('Card artwork').selectOption('live');
 await expect(page.getByRole('button',{name:'White',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Multicolour',exact:true})).toHaveCount(0);
 await expect(page.locator('#print-total')).toContainText('50 cards');
});

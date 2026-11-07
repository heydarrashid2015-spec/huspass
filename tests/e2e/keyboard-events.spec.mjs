import {test,expect} from '@playwright/test';
test('cross-platform keyboard diagnostics avoid typed content',async({page})=>{
 await page.goto('/keyboard-events.html');
 const input=page.getByLabel('Test input');
 await input.fill('private-test-string');
 await input.focus();
 await expect(page.locator('#events')).toContainText('focus');
 await expect(page.locator('#events')).not.toContainText('private-test-string');
 await expect(page.locator('#events')).toContainText('vh=');
});

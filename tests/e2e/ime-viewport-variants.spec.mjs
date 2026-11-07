import {test,expect} from '@playwright/test';
for(const variant of ['default','resize-content','resize-visual']){
 test('static IME viewport variant '+variant,async({page})=>{
  await page.goto('/ime-viewport-'+variant+'.html');
  const input=page.getByLabel('Test input');
  await expect(input).toBeVisible();
  await input.fill('typing works');
  await expect(input).toHaveValue('typing works');
  await expect(page.locator('script')).toHaveCount(0);
 });
}

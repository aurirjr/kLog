import { KLogIdeaPage } from './app.po';

describe('k-log-idea App', () => {
  let page: KLogIdeaPage;

  beforeEach(() => {
    page = new KLogIdeaPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

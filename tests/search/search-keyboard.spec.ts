import { expect, test } from '../fixtures';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { getSelectAllShortcut } from '../../shared/helpers/platform';

const SELECT_ALL = getSelectAllShortcut();
const INITIAL_QUERY = 'train';
const REPLACEMENT_QUERY = 'car';

test.describe('Search keyboard interaction', () => {
  /**
   * Catawiki's search field is a React-controlled combobox with an autocomplete dropdown, so
   * every keystroke passes through application code. Incorrect key handling can move the caret,
   * swallow a Delete, or desynchronise the rendered value from component state — this test
   * therefore verifies the exact input value after every single edit.
   */
  test('[TC-CAT-06][Functional][Keyboard] Verify search field supports keyboard entry, editing, selection replacement and submission', async ({
    page,
    homePage,
    searchResultsPage,
  }) => {
    const input = homePage.searchInput;

    await test.step('Open the homepage and focus the search field', async () => {
      await homePage.open();

      await expect(input).toBeVisible();
      await expect(input).toBeEnabled();

      await input.focus();
      await expect(input, 'the search field must hold keyboard focus').toBeFocused();
    });

    await test.step(`Type "${INITIAL_QUERY}" and verify the exact value`, async () => {
      await input.pressSequentially(INITIAL_QUERY);
      await expect(input).toHaveValue(INITIAL_QUERY);

      // Let the autocomplete finish updating before editing, otherwise its re-render can land
      // after an edit and restore the previous value.
      await homePage.waitForSuggestionsToSettle();
      await expect(input, 'the autocomplete update must not overwrite what was typed').toHaveValue(
        INITIAL_QUERY,
      );
    });

    await test.step('Move the caret with arrow keys without altering the value', async () => {
      await input.press('ArrowLeft');
      await input.press('ArrowRight');
      await expect(input, 'caret movement alone must not change the value').toHaveValue(
        INITIAL_QUERY,
      );
    });

    await test.step('Backspace removes the character before the caret', async () => {
      await input.press('ArrowLeft'); // caret sits between "trai" and "n"
      await input.press('Backspace');
      await expect(input, 'Backspace must remove exactly the preceding character').toHaveValue(
        'tran',
      );
    });

    await test.step('The deleted character can be restored', async () => {
      await input.press('i');
      await expect(input).toHaveValue(INITIAL_QUERY);
    });

    await test.step('Delete removes the character after the caret', async () => {
      await input.press('Delete');
      await expect(input, 'Delete must remove exactly the following character').toHaveValue('trai');
    });

    await test.step('The value can be restored again', async () => {
      await input.press('n');
      await expect(input).toHaveValue(INITIAL_QUERY);
    });

    await test.step(`Select all and replace with "${REPLACEMENT_QUERY}"`, async () => {
      await input.press(SELECT_ALL);
      await input.pressSequentially(REPLACEMENT_QUERY);

      await expect(
        input,
        'the replacement must overwrite the selection, not append to it',
      ).toHaveValue(REPLACEMENT_QUERY);

      await homePage.waitForSuggestionsToSettle();
      await expect(input, 'the autocomplete update must not overwrite the replacement').toHaveValue(
        REPLACEMENT_QUERY,
      );
    });

    await test.step('Edit the replacement value with Backspace and Delete', async () => {
      await input.press('ArrowLeft'); // caret sits between "ca" and "r"
      await input.press('Backspace');
      await expect(input).toHaveValue('cr');

      await input.press('a');
      await expect(input).toHaveValue(REPLACEMENT_QUERY);

      await input.press('Delete');
      await expect(input).toHaveValue('ca');

      await input.press('r');
      await expect(
        input,
        'the final query must contain no missing or duplicated characters',
      ).toHaveValue(REPLACEMENT_QUERY);
    });

    await test.step('Submit the final query with Enter', async () => {
      await homePage.submitSearchWithKeyboard();
      await searchResultsPage.waitForResults();

      await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);
      await expect(page, 'the submitted query must be the final edited value').toHaveURL(
        new RegExp(`q=${REPLACEMENT_QUERY}\\b`),
      );
      await expect(searchResultsPage.heading).toContainText(new RegExp(REPLACEMENT_QUERY, 'i'));
    });

    await test.step(`Verify the earlier query "${INITIAL_QUERY}" was not submitted`, () => {
      expect(page.url(), 'the replaced query must not reach the results page').not.toContain(
        `q=${INITIAL_QUERY}`,
      );
    });
  });
});

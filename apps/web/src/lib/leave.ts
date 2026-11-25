/** Leaves the page for another address. Apart so that the apps' hand-off can be tested. */
export function leaveTo(url: string) {
  window.location.assign(url);
}

import * as ynab from "ynab";

/**
 * Converts milliunits to currency amount (e.g., 50250 -> 50.25)
 * YNAB stores amounts as milliunits (1/1000 of the currency unit)
 */
export const toUnit = (milliunits: number): number =>
  ynab.utils.convertMilliUnitsToCurrencyAmount(milliunits);

/**
 * Converts currency amount to milliunits (e.g., 50.25 -> 50250)
 * Rounds to the nearest milliunit to avoid floating point issues
 */
export const toMilliunits = (amount: number): number => Math.round(amount * 1000);

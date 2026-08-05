/**
 * The origin is split across several spans for the dim/bright treatment, so screen
 * readers are pointed at these nodes instead — one clean URL and one verdict sentence.
 */
export const DESTINATION_URL_ELEMENT_ID = 'consent-destination-url';
export const DESTINATION_HEADLINE_ELEMENT_ID = 'consent-destination-headline';
export const DESTINATION_LABEL_ELEMENT_ID = 'consent-destination-label';
export const ACKNOWLEDGE_ELEMENT_ID = 'consent-acknowledge';

/** Path and query are attacker-controlled noise; past this they are ellipsised. */
export const MAX_PATH_DISPLAY_LENGTH = 80;

export const DESTINATION_PANEL_MIN_HEIGHT = 180;
export const CONSENT_CARD_MAX_WIDTH = 520;
export const LOGO_BADGE_SIZE = 56;

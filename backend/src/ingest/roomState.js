export const ROOM_STATES = {
  EMPTY: "EMPTY",
  OCCUPIED_STATIC: "OCCUPIED_STATIC",
  ACTIVE: "ACTIVE",
};

export function deriveRoomState({ presence, motion }) {
  if (presence === 0 && motion === 0) return ROOM_STATES.EMPTY;
  if (presence === 1 && motion === 1) return ROOM_STATES.OCCUPIED_STATIC;
  if (presence === 1 && motion === 2) return ROOM_STATES.ACTIVE;

  throw new Error(
    `forbidden state combination: presence=${presence}, motion=${motion}`,
  );
}

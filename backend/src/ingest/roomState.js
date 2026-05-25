export const ROOM_STATES = {
  UNOCCUPIED: "UNOCCUPIED",
  OCCUPIED_STATIC: "OCCUPIED_STATIC",
  OCCUPIED_ACTIVE: "OCCUPIED_ACTIVE",
};

export function deriveRoomState({ presence, motion }) {
  if (presence === 0 && motion === 0) return ROOM_STATES.UNOCCUPIED;
  if (presence === 1 && motion === 1) return ROOM_STATES.OCCUPIED_STATIC;
  if (presence === 1 && motion === 2) return ROOM_STATES.OCCUPIED_ACTIVE;

  throw new Error(
    `forbidden state combination: presence=${presence}, motion=${motion}`,
  );
}

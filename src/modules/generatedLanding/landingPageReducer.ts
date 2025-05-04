import type { GPTOutput } from "@/modules/prompt/types"

export type LandingPageState = GPTOutput

export type Action = {
  type: "UPDATE_FIELD"
  payload: {
    path: string // e.g., "hero.headline" or "offer.bullets[1]"
    value: string
  }
}

export function landingPageReducer(state: LandingPageState, action: Action): LandingPageState {
  const newState = structuredClone(state)
  const keys = action.payload.path.replace(/\[(\d+)\]/g, ".$1").split(".")
  let target: any = newState

  for (let i = 0; i < keys.length - 1; i++) {
    target = target[keys[i]]
  }

  target[keys[keys.length - 1]] = action.payload.value
  return newState
}

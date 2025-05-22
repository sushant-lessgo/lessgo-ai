import type { GPTOutput } from "@/modules/prompt/types"
import { getThemeByName } from "@/components/theme/predefinedThemes"
import { useThemeStore } from "@/stores/useThemeStore"

export type LandingPageState = GPTOutput

export type Action =
  | {
      type: "SET_GPT_OUTPUT"
      payload: GPTOutput
    }
  | {
      type: "UPDATE_FIELD"
      payload: {
        path: string
        value: any
      }
    }
  | {
      type: "SET_SECTION_VISIBILITY"
      payload: {
        section: string
        visible: boolean
      }
    }

export function landingPageReducer(
  state: LandingPageState,
  action: Action
): LandingPageState {
  switch (action.type) {
    case "SET_GPT_OUTPUT": {
      const themeObject = getThemeByName(action.payload.theme)
      useThemeStore.getState().setTheme(themeObject)

      return action.payload
    }

    case "SET_SECTION_VISIBILITY": {
      return {
        ...state,
        visibleSections: {
          ...(state.visibleSections || {}),
          [action.payload.section]: action.payload.visible,
        },
      }
    }

    case "UPDATE_FIELD": {
      const newState = structuredClone(state)
      const keys = action.payload.path.replace(/\[(\d+)\]/g, ".$1").split(".")
      let target: any = newState

      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]]
      }

      target[keys[keys.length - 1]] = action.payload.value
      return newState
    }

    default:
      return state
  }
}

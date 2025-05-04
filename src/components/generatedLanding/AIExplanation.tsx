type TargetPersona = {
    role: string
    pain_points: string
    aspirations: string
    sophistication_level: string
  }
  
  type MarketPositioning = {
    category: string
    primary_competitors: string[]
    key_differentiation: string
  }
  
  type CopywritingStrategy = {
    tone: string
    structure_choice: string
    persuasion_focus: string
  }
  
  type Props = {
    criticalAssumptions: string[]
    targetPersona: TargetPersona
    marketPositioning: MarketPositioning
    copywritingStrategy: CopywritingStrategy
  }
  
  export default function AIExplanation({
    criticalAssumptions,
    targetPersona,
    marketPositioning,
    copywritingStrategy,
  }: Props) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-5 text-sm shadow-sm text-gray-800 space-y-2">
        <h3 className="text-heading4 text-brand-logo">AI Thought Process</h3>
  
        <div>
          <p className="font-semibold mb-1">Key Assumptions</p>
          <ul className="list-disc list-inside space-y-1">
            {criticalAssumptions.map((assumption, i) => (
              <li key={i}>{assumption}</li>
            ))}
          </ul>
        </div>
  
        <div>
          <p className="font-semibold mb-1">Target Persona</p>
          <ul className="list-inside space-y-1">
            <li><strong>Role:</strong> {targetPersona.role}</li>
            <li><strong>Pain:</strong> {targetPersona.pain_points}</li>
            <li><strong>Aspiration:</strong> {targetPersona.aspirations}</li>
            <li><strong>Skill Level:</strong> {targetPersona.sophistication_level}/5</li>
          </ul>
        </div>
  
        <div>
          <p className="font-semibold mb-1">Market Positioning</p>
          <ul className="list-inside space-y-1">
            <li><strong>Category:</strong> {marketPositioning.category}</li>
            <li><strong>Competitors:</strong> {marketPositioning.primary_competitors.join(", ")}</li>
            <li><strong>You're Different Because:</strong> {marketPositioning.key_differentiation}</li>
          </ul>
        </div>
  
        <div>
          <p className="font-semibold mb-1">Copywriting Strategy</p>
          <ul className="list-inside space-y-1">
            <li><strong>Tone:</strong> {copywritingStrategy.tone}</li>
            <li><strong>Structure:</strong> {copywritingStrategy.structure_choice}</li>
            <li><strong>Persuasion Focus:</strong> {copywritingStrategy.persuasion_focus}</li>
          </ul>
        </div>
      </div>
    )
  }
  
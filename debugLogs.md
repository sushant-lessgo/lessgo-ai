📝 Text editing mode changed: 
{isEditing: false, element: undefined, currentToolbar: 'element'}
currentToolbar
: 
"element"
element
: 
undefined
isEditing
: 
false
[[Prototype]]
: 
Object
aiActions.ts:124 Regenerate element request: 
{sectionId: 'hero', elementKey: 'headline', currentContent: '...', tokenId: 'l9CjoTF0VJ9Y'}
currentContent
: 
"..."
elementKey
: 
"headline"
sectionId
: 
"hero"
tokenId
: 
"l9CjoTF0VJ9Y"

aiActions.ts:132  POST http://localhost:3000/api/regenerate-element?tokenId=l9CjoTF0VJ9Y 400 (Bad Request)
regenerateElementWithVariations @ aiActions.ts:132
handleRegenerate @ ElementToolbar.tsx:114
onClick @ ElementToolbar.tsx:256
callCallback @ react-dom.development.js:20565
invokeGuardedCallbackImpl @ react-dom.development.js:20614
invokeGuardedCallback @ react-dom.development.js:20689
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20703
executeDispatch @ react-dom.development.js:32128
processDispatchQueueItemsInOrder @ react-dom.development.js:32160
processDispatchQueue @ react-dom.development.js:32173
dispatchEventsForPlugins @ react-dom.development.js:32184
eval @ react-dom.development.js:32374
batchedUpdates$1 @ react-dom.development.js:24953
batchedUpdates @ react-dom.development.js:28844
dispatchEventForPluginEventSystem @ react-dom.development.js:32373
dispatchEvent @ react-dom.development.js:30141
dispatchDiscreteEvent @ react-dom.development.js:30112Understand this error
ElementToolbar.tsx:117 Failed to generate variations: Error: API error: 400
    at regenerateElementWithVariations (aiActions.ts:146:17)
    at async Object.handleRegenerate [as handler] (ElementToolbar.tsx:114:7)
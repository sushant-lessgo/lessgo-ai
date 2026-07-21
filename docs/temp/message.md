## Original message

Hi Sushant,
spent proper time with Lessgo AI.
Honest take below - feel free to push back on anything

1. UI/UX - UI is little disappointing (I'm talking about your website, not the generated page), UX is solid - far better than some well stated platform. Current design looks like a wordpress Admin
What you can do? Either you can use ShadCN or any other preferred library with modern looking design.

2. Output: not too bad, but not the one that I can use in my website, harsh - I know but true.
Issues that I noticed:
- All sections are not consistent
- when I click on any element to edit, above header (that have preview) option hide entirely, I checked in devtool - it hides behind the main header
- Ai feature is not working for copy for a specific stack

What missing:
- style picker that contains the page category (like 'modern', 'classic', 'minimalist', 'condensed')
- stack information

Improvement:
- instead of the top sticky, make the header (with options) floating like Figma
- emoji 😅 looks odd, Luicide icons with a proper stroke enough for a good look
- animation options - because modern landing page needs clarity, motion (we can't justify it by good for MVP)
- add more good font pair, and add option for single or dual font (many designer and dev prefer just one font for all UI) - mostly I used SUSE, INTER, POPPINS

Now here are some genuine suggestion about arch and other things:
This is based on my own experience building solo take what's useful, ignore what isn't. if you thing any suggestion helps you - just let me know. (I don't know about your arch, this is my suggestion, you can entirely skip this)
- You should first create a controller, data handler and components, registry handler to make your landing page designer more useful
Why?  
1. Controller helps you to manage the components and its states (you can see a live example on my https://t.co/C5cOdmvOUe UI library and check any component preview - that uses the same method, where you can change any prop value live, this is dynamic and work for all components).
2. Handler for options and props handling
3. Components - so user can switch between different style for the same component (but modern style like)
4. Registry Handler - so you can use other registry like Reacts bits, and Shadcn other registries components

What's your current biggest challenge with it distribution or product?


## New message

Hey Sushant,

Been a few months since we went through the Lessgo AI review. Curious where things landed, did the controller/handler/component split end up helping, and is the AI copy generation working now?

I'm asking because I've been building out full-stack + AI systems since then, and if you're still short on hands for the frontend/AI layer, happy to help as a contractor or come on for retainer work. No pressure either way, just wanted to put it on your radar.

Let me know how Lessgo is doing.

## My response

Hi Yashraj,

Apologies for late response. Was busy with consuming Fable :P. Great to hear from you :)

The split up was already there.. was just using some different names.

We evolved the product from landing page builder to full website builder and from SaaS founders as target audience to non-technical business owners. I realised SaaS founder love to use Claude code so pivoted.

The product is in private beta nd oing very well.

I am not looking for more hands right now. I will let you know if any possibility in future.

Hope your build is working well as well.

Thanks again.

## My response — alternative

Hi Yashraj,

Sorry for the late reply — heads-down shipping. Great to hear from you, and thanks for circling back.

On the architecture: that controller / data-handler / component / registry split was actually already in place — just under different names. The edit store is the controller, the section/element contracts are the data layer, and there's a component registry underneath. The one spot I deliberately diverge is the open-registry idea (pulling in ShadCN / React Bits directly): published pages render through a separate server-safe renderer, so every block needs a server-safe twin — I can't drop external components in raw. Where your framing lands well is per-block style switching, which is exactly the direction I'm building toward.

Bigger picture: since we last talked the product evolved from a landing-page builder into a full website builder, and the target shifted from SaaS founders to non-technical business owners — turns out SaaS founders mostly reach for Claude Code themselves, so I leaned into the audience that actually needs this. It's in private beta now and going well.

Not looking for more hands at the moment, but I appreciate the offer and I'll reach out if that changes.

Hope your own build is coming along. Thanks again for the thoughtful notes.

Now I have the full picture. The pipeline is actually wired correctly — let me explain what's really broken:                                                                  
  Root Causes                                                                                                                                                                 
  
  1. Paper texture: SVG filters don't work in CSS background-image                                                                                                                                                                                                                                                                                          
  The paper texture uses feTurbulence SVG filter inside a data: URL:
  background: url("data:image/svg+xml,...feTurbulence..."), linear-gradient(...)
  Browsers block SVG filters when SVG is used as CSS background-image — it's a security restriction (SVG in "secure static mode" disables filters, scripts, events). So the   
  paper texture renders as a completely blank layer — effectively invisible.

  2. Dot-grid opacity is 0.04 (4%) — barely perceptible

  Even though dot-grid uses pure CSS (radial-gradient) and works correctly, rgba(0,0,0,0.04) is nearly invisible on both dark and light backgrounds.

  3. No standalone "noise" texture exists

  The textures array only has: dot-grid, line-grid, paper, none. There's no noise entry.

  The Fix

  Paper/noise need to use pure CSS approaches instead of SVG filters. And opacity needs to be much higher.

  Want me to rewrite the textures to use visible, CSS-only implementations? For example:
  - Paper: Use a repeating CSS gradient with subtle random-looking patterns (~8-12% opacity)
  - Noise: Add a new texture using a multi-layered CSS gradient noise approximation
  - Bump dot-grid opacity to ~8-10%
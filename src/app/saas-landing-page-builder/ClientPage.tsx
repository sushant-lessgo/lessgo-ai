"use client";
import { useState } from "react";
// import CTAButton from "../components/CTAButton";
import WaitlistForm from "../components/WaitlistForm";
import Image from 'next/image';
import founderImage from '@/assets/images/founder.jpg';
import { Check } from 'lucide-react';



export default function ClientPage() {
  const [showForm, setShowForm] = useState(false);
  return (
   
   <>

   
<main className="flex flex-col items-center justify-center px-6 py-20">
        {/* Heading1 */}
        <h1 className="text-heading1 font-heading text-brand-text leading-tight max-w-[70rem] mt-4 text-center">
          F*ck Launch Anxiety <span className="underline text-brand-accentPrimary"></span>
        </h1>

        {/* Heading2 */}
        <p className="text-heading2 text-brand-text max-w-[60rem] mt-12 mb-2 text-center">
          Get <span className=" text-brand-accentPrimary">High-Converting SaaS Landing Pages</span> in 5 Minutes 
        </p>

        {/* Heading4 */}
        <p className="text-heading4 text-brand-text max-w-[40rem] mt-10 mb-2 text-center">
          Describe your SaaS idea <span className=" text-brand-accentPrimary"> → </span> Chat with AI <span className=" text-brand-accentPrimary"> → </span> Get a ready-to-launch landing page (both <span className=" text-brand-accentPrimary">copy and design</span>)
        </p>

        {/* {!showForm && (
          <CTAButton
            gaLabel="01 hero-section"
            onClick={(e) => {
              e.preventDefault();
              setShowForm(true);
            }}
          />
        )}

        {showForm && <WaitlistForm />} */}

        <p className="text-lg md:text-base font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-20 text-center">
          [Launching May 7... <span className="font-bold"> Only 20 Spots </span>... <span className=" text-brand-accentPrimary"> 1 Year Free </span> Pro for early SaaS founders] <span className="underline text-brand-accentPrimary"></span>
        </p>

        <div className="text-brand-text text-left">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="mb-4 max-w-3xl mx-auto text-body space-y-6 leading-relaxed">

              <p className="text-heading3 text-center mb-10">The Real Reason Launching Your SaaS Feels So Hard (And It's Not Your Product)</p>

              <div className="mb-24 max-w-3xl mx-auto text-body leading-relaxed space-y-8 pt-6">

                <div className="text-left space-y-6 text-[1.1rem]">

                  <p className="font-bold text-primary mb-6 text-lg">Dear SaaS Founder,</p>

                  <p>If you're building a SaaS product… Then you will probably agree that…</p>

                  <p className="italic">"Launching isn't hard because the product isn’t ready."</p>

                  <p className="font-normal">
                    It’s hard because you're not sure
                    <span className="inline-block bg-brand-highlightText font-semibold rounded px-2 py-1 ml-2">
                      if your message is right.
                    </span>
                  </p>

                  <p>You’ve solved a real problem.</p>
                  <p>You’ve built a great SaaS idea.</p>
                  <p>But one question is bothering you:</p>

                  <div>
                    <p className="inline-block bg-brand-highlightText font-semibold rounded px-4 py-2 text-[1.15rem] text-primary">
                      Will anyone even get it?
                    </p>
                  </div>

                  <p>You’re not alone…</p>

                  <div className="border-l-4 border-primary bg-brand-highlightBG/60 p-4 rounded-md space-y-3">
                    <p className="font-semibold">CB Insights studied 110+ failed SaaS startups.</p>
                    <p className="font-semibold">And the results were shocking…</p>
                    <p className="italic text-muted">“Poor communication of product value” leading to “No market need” was the #1 non-financial reason.</p>
                  </div>

                </div>

              </div>

              <p className="text-heading3 text-center pt-20 pb-2">Clear Messaging: The Hidden Secret Behind Every Blockbuster SaaS Launch</p>

              <p className="font-medium text-brand-text/80 mb-6 max-w-2xl">
                Great SaaS products win because people instantly understand them. Here are a few examples that nailed their message:
              </p>


    

      
<div className="bg-brand-highlightBG/70 py-8 px-6 rounded-xl space-y-6">

{/* Dropbox */}
<div className="border-l-4 border-brand-accentPrimary pl-4">
  <p className="text-brand-accentPrimary font-semibold">Dropbox</p>
  <p className="italic text-body text-[1rem]">"Put your stuff in this folder. Access it anywhere."</p>
</div>

{/* Slack */}
<div className="border-l-4 border-brand-accentPrimary pl-4">
  <p className="text-brand-accentPrimary font-semibold">Slack</p>
  <p className="italic text-body text-[1rem]">"Be less busy."</p>
</div>

{/* Airbnb */}
<div className="border-l-4 border-brand-accentPrimary pl-4">
  <p className="text-brand-accentPrimary font-semibold">Airbnb</p>
  <p className="italic text-body text-[1rem]">"Live like a local."</p>
</div>

{/* Superhuman */}
<div className="border-l-4 border-brand-accentPrimary pl-4">
  <p className="text-brand-accentPrimary font-semibold">Superhuman</p>
  <p className="italic text-body text-[1rem]">"The fastest email experience ever made."</p>
</div>

</div>

      
<p>They didn’t just build amazing SaaS products.</p>
<p className="font-medium">They made their messaging so clear, the world couldn’t ignore them.</p>



            <div className="mb-24 max-w-3xl mx-auto text-body leading-relaxed space-y-8 pt-16">

{/* Section Heading */}
<h2 className="text-heading3 text-center font-bold text-primary">
  Quick Reality Check: Will Your Page Pass the 10-Second Test?
</h2>

{/* Lead-in Text */}
<p className="text-[1.1rem]">
  Wondering if your messaging is clear enough?
</p>

<p className=" font-semibold text-[1.1rem] text-primary">
  Run this simple 10-second founder self-test:
</p>

{/* Checklist */}
<ul className="pl-8 space-y-4 text-[1.05rem]">
  <li className="flex items-start gap-3">
    <Check className="w-5 h-5 text-green-600 mt-1" />
    <span>Can a stranger understand what your product does in 10 seconds?</span>
  </li>
  <li className="flex items-start gap-3">
    <Check className="w-5 h-5 text-green-600 mt-1" />
    <span>Can they tell who it's for... and why they should care... just from your headline?</span>
  </li>
  <li className="flex items-start gap-3">
    <Check className="w-5 h-5 text-green-600 mt-1" />
    <span>If you removed your brand name, would your page still sound different?</span>
  </li>
</ul>

{/* Final Warning */}
<div className="text-center">
  <p className="inline-block bg-brand-highlightText font-semibold rounded-lg px-4 py-2 text-[1.15rem] text-primary">
    If you’re even a little unsure... your messaging needs help... before you need more traffic.
  </p>
</div>

</div>

          

    
            <p className="text-heading3 text-center pt-20 pb-2 ">Launch Messy? Yes.  Launch Confusing? Never.    </p>
            

            <p> Now, you might be thinking...   </p>
            <div>
            <p className="italic mb-1"> "Isn't some confusion normal early on?"   </p>
            <p className="italic">  "Shouldn't I just launch messy and figure it out later?"  </p>
            </div>
            <p>  And honestly?  </p>
            <p> You're right...    </p>
            <p>Look... <span className="font-semibold">messy is fine</span>.</p>

            <p>  Your design can be messy.  </p>
            <p> Your features can be messy.   </p>
            <p className="italic">  Even your onboarding can be messy.  </p>
            <p><span className="font-bold">But your message can't be</span>.</p>

            {/* <p>  If people don’t “get it” in the<span className="inline-block  bg-brand-highlightText bg-opacity-30 font-semibold rounded px-1 py-0.5 ml-1">first 10 seconds </span>,  </p>

            <p>  They<span className="inline-block bg-brand-highlightText bg-opacity-30 font-semibold rounded px-1 py-0.5 ml-1">won't stick around</span> long enough to see what you built.  </p> */}
           
            <p className="leading-relaxed">
              If people don’t “get it” in the
              <span className="inline-block bg-brand-highlightText/70 font-semibold rounded-md px-2 py-1 mx-1">
                first 10 seconds
              </span>
              they
              <span className="inline-block bg-brand-highlightText/70 font-semibold rounded-md px-2 py-1 mx-1">
                won't stick around
              </span>
              long enough to see what you built.
            </p>

           
            <p> And the worst part?   </p>


            <p className="text-heading3 text-center pt-20 pb-2 ">  The Tools You Tried Were Never Built to Truly Help You  </p>
          

<div className="space-y-6 text-brand-text leading-relaxed max-w-3xl">

<p>Even when you try to fix it...</p>
<p>The tools you’re given don’t fix it.</p>
<p>They make it worse.</p>

<p>You already know the story... you've tried tool after tool:</p>

<ul className="pl-6 mb-8 text-body space-y-2">
  <li className="flex items-start gap-3">
    <span className="text-red-500">❌</span>
    <span>AI headline generators</span>
  </li>
  <li className="flex items-start gap-3">
    <span className="text-red-500">❌</span>
    <span>Drag-and-drop site builders</span>
  </li>
  <li className="flex items-start gap-3">
    <span className="text-red-500">❌</span>
    <span>Pretty templates</span>
  </li>
</ul>

<p>They helped you build a page.</p>

<p className="inline-block bg-brand-highlightText/60 font-semibold rounded-md px-4 py-2">
  But they didn’t help you find your true message.
</p>

<p>They skipped the hard part...</p>

<ul className="pl-6 mb-8 text-body space-y-2">
  <li className="flex items-start gap-3">
    <span className="text-green-600">✅</span>
    <span>Understanding your customer.</span>
  </li>
  <li className="flex items-start gap-3">
    <span className="text-green-600">✅</span>
    <span>Clarifying your value.</span>
  </li>
  <li className="flex items-start gap-3">
    <span className="text-green-600">✅</span>
    <span>Crafting a real narrative.</span>
  </li>
</ul>

<p className="italic">And without that…</p>

<p className="font-semibold text-xl mt-4">No headline or hero image will save you.</p>



</div>
<div className="my-12 h-px bg-brand-text/20"></div>


            <div className="mb-20">
          {/* {!showForm && (
        <CTAButton
          gaLabel="02 problem-section"
          text = 'Get Early Beta Access!'
          onClick={(e) => {
            e.preventDefault(); // If you're still using <a> in CTAButton
            setShowForm(true); // ✅ Toggle the form
          }}
        />
      )}

      {showForm && <WaitlistForm />} */}
      
      <p className="text-lg md:text-base text-center font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-16">
      [Launching May 7... <span className= "font-bold"> Only 20 Spots </span>... <span className=" text-brand-accentPrimary"> 1 Year Free </span> Pro] <span className="underline text-brand-accentPrimary"></span>
      </p>

          </div>

      </div>

          

<div className="mb-4 max-w-3xl mx-auto text-body space-y-6 leading-relaxed">

  <p className="text-heading3 text-center pt-20 pb-2 font-bold">Lessgo.ai: Built to Solve the Right Problem</p>

  <p>Lessgo.ai was built to fix this gap.</p>
  <p>It doesn’t just generate "stuff."</p>
  <p>It digs deep into your <span className="font-semibold">product</span>, your <span className="font-semibold">market</span>, and your <span className="font-semibold">user psychology</span>...</p>

  <p className="inline-block bg-brand-highlightText text-body font-semibold rounded px-2 py-1">
    And builds a page that actually sells.
  </p>

  <p className="pt-8">Now, you might still wonder...</p>

  <div className="space-y-1">
    <p className="italic text-muted">"Come on, does messaging really make that big of a difference?"</p>
    <p className="italic text-muted">"If the product is good enough, won't people eventually figure it out?"</p>
  </div>

  <p>Let’s be real:</p>
  <p>The world isn't fair to great products.</p>
  <p>It rewards clear ones.</p>
  <p>If people don’t understand your value in 10 seconds,</p>
  <p>it doesn’t matter how good your product is.</p>

  <p className="font-semibold text-heading3">Confusion kills momentum.</p>

  <p className="inline-block bg-brand-highlightText text-body font-semibold rounded px-2 py-1">
    Clarity creates it.
  </p>

  <p>The best SaaS companies don’t win because they built the best tech.</p>
  <p>They win because they <span className="font-semibold">explain it better, faster, sharper.</span></p>

  <p className="pt-8">Still not convinced?</p>
  <div className="border-l-4 border-primary bg-brand-highlightBG p-4 my-6 rounded-md hover:scale-105 transition">
  <p className="text-primary font-semibold">Paul Graham (Y Combinator founder) said it best:</p>
  <div className="mt-2 space-y-2">
    <p className="italic">"Startups rarely die because they don't build something good."</p>
    <p className="italic">"They die because they can't get users."</p>
  </div>
</div>


  <p>Users don’t just convert.</p>
  <p>They have to understand... fast.</p>
  <p>April Dunford calls this "positioning failure."</p>
  <p>First Round Review calls it "message-market fit."</p>
  <p>No matter who you listen to...</p>

  <p>The message is clear:</p>

  <p className="inline-block bg-brand-highlightText text-body font-semibold rounded px-2 py-1">
    If they don’t get it, you don’t get them.
  </p>

  <p className="pt-8">Now, maybe you're thinking:</p>

  <div className="space-y-1">
    <p className="italic text-muted">"Okay, fine... I get it."</p>
    <p className="italic text-muted">"Messaging is critical."</p>
    <p className="italic text-muted">"But I'm not a copywriter."</p>
    <p className="italic text-muted">"I wouldn’t even know where to start."</p>
  </div>

  <div className="space-y-4 leading-relaxed">
  <p>And you know what?</p>
  <p>You’re absolutely right.</p>
  <p>Look... nobody becomes a founder because they dream of writing landing page copy.</p>
  <p>You’re a builder.</p>
  <p>You solve real problems.</p>
  <p>You create new things from nothing.</p>
  <p>You’re not supposed to be a copywriter.</p>
  <p>And honestly?</p>
  <p>Even good copywriters struggle to write about their own products clearly.</p>

  <p className=" inline-block bg-brand-highlightBG rounded-md px-4 py-2 font-semibold">
    And that's exactly why I built Lessgo.ai.
  </p>
</div>


</div>



<div className="mb-4 max-w-3xl mx-auto text-body leading-relaxed space-y-8">

  {/* Heading */}
  <h2 className="text-heading3 text-center font-bold text-primary pt-16">Why Lessgo.ai Is the Best SaaS Landing Page Builder for Early-Stage Founders</h2>

  {/* Intro */}
  <div className="space-y-4">
  <p className="pt-6">Lessgo.ai doesn’t just generate "stuff"... it crafts messaging and layout that speaks directly to your ideal SaaS user.</p>
  <p>It’s like having a copywriter, designer, and marketer rolled into one... built for your SaaS launch journey.</p>
    
    <p>
    It’s powered by Something I call
      <span className="inline-block bg-brand-accentPrimary/10 text-brand-accentPrimary font-bold rounded-full px-3 py-1 ml-2">
      Conversion Intelligence Engine
      </span>.
    </p>
  </div>

  {/* How It Works */}
  <div className="space-y-4">
    <p className="text-lg font-semibold text-primary">Here’s how it works:</p>
    <p>Instead of asking you to pick a template...</p>
    <p>It asks you a few smart, intuitive questions... like a real cofounder would.</p>
    <p>
      It digs into <span className="font-semibold">your product’s true angles:</span>
    </p>

    {/* Bullets */}
    <ul className="pl-6 space-y-3">
      <li className="flex items-start gap-2">
        <span className="text-accent font-bold">›</span>
        <span>Who it's for.</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent font-bold">›</span>
        <span>Why it matters.</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent font-bold">›</span>
        <span>What problem it crushes.</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-accent font-bold">›</span>
        <span>What emotions it triggers.</span>
      </li>
    </ul>
  </div>

  {/* Heavy Lifting */}
  <div className="space-y-4">
    <p>Then it does the heavy lifting for you:</p>
    <p>It crafts your copy, layout, and flow... based on real psychological triggers that actually convert...</p>
    <p>Not based on pretty templates that look good but don't sell.</p>
    
    <p className="inline-block bg-brand-highlightText text-body font-semibold rounded px-2 py-1 mt-4">
                It’s not just a landing page tool — it’s a SaaS founder’s launch weapon.
              </p>

    <p>Framed perfectly for your ideal customer.</p>
    <p>All you have to do is answer a few simple prompts.</p>
    <p>And let the engine translate your ideas into momentum.</p>
    <p>Because launching isn’t about looking pretty.</p>
    <p>It’s about being understood.</p>
  </div>

  {/* Emotional Payoff */}
  <div className=" italic space-y-2 pt-8">
    <p>And when you're understood...</p>
    <p>you don't just launch.</p>
    <p>You take off.</p>
  </div>

</div>




<div className="mb-24">
          {/* {!showForm && (
        <CTAButton
          gaLabel="03 Solution-section"
          text="Get Early Access Now!"
          onClick={(e) => {
            e.preventDefault(); // If you're still using <a> in CTAButton
            setShowForm(true); // ✅ Toggle the form
          }}
        />
      )}

      {showForm && <WaitlistForm />} */}
      
      <p className="text-lg md:text-base text-center font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-16">
      [Launching May 7... <span className= "font-bold"> Only 20 Spots </span>... <span className=" text-brand-accentPrimary"> 1 Year Free </span> Pro] <span className="underline text-brand-accentPrimary"></span>
      </p>

          </div>


<div className="mb-24 max-w-3xl mx-auto text-body space-y-10 leading-relaxed pt-8">

  <section className="bg-brand-highlightBG py-12 rounded-xl shadow-sm">

    {/* Heading */}
    <p className="text-heading3 text-center font-bold pb-8">
      Why I Had to Build This... And Why It Matters To You
    </p>

    {/* Content Block */}
    <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">

      {/* Image */}
      <div className="w-full lg:w-1/2">
        <Image
          src={founderImage}
          alt="Founder Sushant Jain"
          className="rounded-xl shadow-lg object-cover mx-auto"
        />
      </div>

      {/* Text */}
      <div className="w-full lg:w-1/2 space-y-6 text-[1.1rem]">

        <p className="italic">Hi, I’m Sushant. A 35-year-old indie hacker from Amsterdam.</p>

        <p>I didn’t build Lessgo.ai because it was trendy.</p>

        <p>I built it after spending 14 years in tech... and realizing a brutal truth:</p>

        <p className="font-semibold text-primary">
          Brilliant builders fail every day.
        </p>

        <p className="italic">Not because their products suck.</p>

        <p className="italic">But because nobody understands what they built.</p>

      </div>
    </div>

    {/* Second Block */}
    <div className="max-w-2xl mx-auto px-6 mt-12 space-y-6 text-[1.1rem]">

      <p className="italic">I lived that pain.</p>

      <p className="font-semibold text-xl">
    So I bet my career on solving it.
  </p>

  <p className="italic text-sm text-gray-600">
    (Yes... I even quit my $150K job to do this full-time.)
  </p>

      <p>Lessgo.ai is not just a tool.</p>

      <p>It’s a promise:</p>

      {/* Hero Punchline */}
      <p className="font-bold text-brand-accentPrimary text-2xl not-italic border-b-2 border-brand-accentPrimary inline-block pb-1">
        Never again.
      </p>

      {/* Signature */}
      <p className="mt-6 font-semibold text-right text-primary">– Sushant</p>

    </div>

  </section>

</div>






      {/* </div> */}

      
      
      <div className="mb-12 max-w-3xl mx-auto text-body leading-relaxed space-y-8 pt-8">

  {/* Heading */}
  <h2 className="text-heading3 text-center font-bold pb-8">
    Your Product is Unique. Your Page Should Be Too.
  </h2>

  {/* User Doubts */}
  <div className="space-y-2 italic text-[1.05rem]">
    <p>"Sounds great..."</p>
    <p>"But my product is different."</p>
    <p>"Will this really work for me?"</p>
    <p>"Will Lessgo.ai actually get my weird product?"</p>
  </div>

  {/* Transition */}
  <div className="space-y-2">
    <p>Fair question.</p>
    <p>Here’s the short answer:</p>
  </div>

  {/* The Core Truth */}
  <div className="space-y-4 text-[1.1rem] font-medium">
    <p>Lessgo.ai doesn’t write <span className="font-bold">FOR</span> you.</p>
    <p>It writes <span className="font-bold">FROM</span> you.</p>
    <p>It doesn’t start with a generic template.</p>
    <p>It starts by pulling your own insights out of your head...</p>
    <p>and sharpening them into clear, powerful messaging.</p>
  </div>

  {/* Bullet points */}
  <ul className="pl-6 space-y-3">
    <li className="flex items-start gap-2">
      <span className="text-brand-accentPrimary font-bold">›</span>
      <span>If your product is complex? <span className="font-semibold">Perfect.</span></span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-brand-accentPrimary  font-bold">›</span>
      <span>If your audience is niche? <span className="font-semibold">Even better.</span></span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-brand-accentPrimary  font-bold">›</span>
      <span>If your story is messy? <span className="font-semibold">Welcome home.</span></span>
    </li>
  </ul>

  {/* Realness and Clarity */}
  <div className="space-y-2 text-[1.1rem]">
    <p>The more real you are in answering the few smart questions we ask,</p>
    <p>the sharper your final landing page will be.</p>
    <p className="font-semibold text-primary">No guessing.</p>
    <p className="font-semibold text-primary">No second-guessing.</p>
    <p>Just real clarity... built from your real product.</p>
  </div>

  {/* Final Emotional Block */}
  <div className="  bg-brand-highlightBG rounded-lg px-6 py-8 font-semibold text-[1.25rem] space-y-2 leading-snug shadow-sm">
    <p>"Your product is unique."</p>
    <p>"Your story is unique."</p>
    <p>"Your landing page should be too."</p>
    <p>Lessgo.ai makes sure of it."</p>
  </div>

</div>


      <div className="mb-20">
          {/* {!showForm && (
        <CTAButton
          gaLabel="04 Founder-section"
          text="Get Early Access Now!"
          onClick={(e) => {
            e.preventDefault(); // If you're still using <a> in CTAButton
            setShowForm(true); // ✅ Toggle the form
          }}
        />
      )}

      {showForm && <WaitlistForm />} */}
      
      <p className="text-lg md:text-base text-center font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-16">
      [Launching May 7... <span className= "font-bold"> Only 20 Spots </span>... <span className=" text-brand-accentPrimary"> 1 Year Free </span> Pro] <span className="underline text-brand-accentPrimary"></span>
      </p>

          </div>

          





  
      
      <div className="mb-12 max-w-3xl mx-auto text-body leading-relaxed space-y-12 pt-24">

  {/* Rally Cry */}
  <div className="text-center space-y-6">
    <h2 className="text-heading2 font-bold ">
      Build Faster. Sell Sharper. Launch Without Doubt.
    </h2>

    <div className="text-[1.1rem] space-y-4">
      <p>The founders who win aren’t always the ones who build better.</p>
      <p>They’re the ones who communicate better... faster.</p>
      <p>You’ve built something real.</p>
      <p className="font-semibold">Now it’s time to make the world see it.</p>
    </div>
  </div>

  {/* Early Access CTA */}
  <div className="text-center bg-brand-highlightBG rounded-xl p-10 space-y-8 shadow-sm">

    <h2 className="text-heading2 font-bold">
      Grab Your Early Access... Before The First 20 Spots Are Gone
    </h2>

    <p className="text-[1.1rem]">
      Here’s what you get if you sign up now:
    </p>

    {/* Benefits List */}
    <ul className="pl-6 space-y-4 text-left max-w-md mx-auto">
      <li className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-1" />
        <span className="text-[1.05rem]">1 Year of Pro Features... Free</span>
      </li>
      <li className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-1" />
        <span className="text-[1.05rem]">Lifetime discount up to 60%</span>
      </li>
      <li className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-1" />
        <span className="text-[1.05rem]">Priority support when we launch</span>
      </li>
      <li className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-1" />
        <span className="text-[1.05rem]">Only for the first 20 founders</span>
      </li>
    </ul>

  </div>

</div>


          <div className="mb-20">
          {/* {!showForm && (
        <CTAButton
          gaLabel="05 CTA-section"
          text="Lock My Early Bird Spot!"
          onClick={(e) => {
            e.preventDefault(); // If you're still using <a> in CTAButton
            setShowForm(true); // ✅ Toggle the form
          }}
        />
      )}

      {showForm && <WaitlistForm />} */}
      
      <p className="text-lg md:text-base text-center font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-16">
      [Launching May 7... <span className= "font-bold"> Only 20 Spots </span>... <span className=" text-brand-accentPrimary"> 1 Year Free </span> Pro] <span className="underline text-brand-accentPrimary"></span>
      </p>
  

      </div>
   
      

          {/* Footer */}
          <footer className="text-center text-gray-600 text-sm ">
            <p>© 2025 Lessgo.AI. All rights reserved.</p>
          </footer>
          
        </div>
      </div>
    

  
    </main>
    </>
  );
}
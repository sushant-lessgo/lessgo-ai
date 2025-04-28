"use client";
import { useState } from "react";
import CTAButton from "./components/CTAButton";
import WaitlistForm from "./components/WaitlistForm";
import Image from 'next/image';
import founderImage from '@/assets/images/founder.jpg';
import { Check, LayoutTemplate } from 'lucide-react';
import { Lightbulb } from "lucide-react"; 

import { Rocket } from "lucide-react"; 
export default function Home() {
  const [showForm, setShowForm] = useState(false);
  return (
   
   <>

{/* <header className="w-full top-0 bg-transparent z-50 shadow-none py-3">
  <div className="max-w-6xl mx-auto flex items-center justify-start">
    <img src="/logo.svg" alt="Lessgo Logo" className="h-48 -my-20" />
  </div>
</header>  */}

<header className="w-full top-0 bg-transparent z-50 shadow-none py-3">
  <div className="max-w-6xl mx-auto flex items-center justify-center px-4">
    <img
      src="/logo.svg"
      alt="Lessgo Logo"
      className="h-14 md:h-16"
    />
  </div>
</header>

   
   <main className="flex flex-col items-center justify-center px-6 py-2">
    
   {/* <div className="w-full bg-[#f5f7fa] py-16"> */}
   {/* <div className="relative w-full max-w-7xl mx-auto bg-[#e3e9f3] rounded-3xl p-12 md:p-10 mt-6 shadow-md overflow-hidden"> */}
  
  {/* Background Image if you want it inside softly */}
  {/* <img
    src="/3.png"
    alt="Background Decoration"
    className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
  /> */}

  {/* Content starts */}
  {/* <div className="relative z-10 flex flex-col items-center"> */}

   {/* eyebrow*/}
    <p className="text-heading4 font-heading text-brand-text leading-tight max-w-[70rem] mt-2 text-center">
    #1 product for indie SaaS founders, solo builders, and launch-first hustlers <span className="underline text-brand-accentPrimary"></span>
      </p>

      {/* Heading1*/}
      <h1 className="text-heading1 font-heading text-brand-text leading-tight max-w-[70rem] mt-8 md:mt-4 text-center">
      Your code rocks. Your <span className="text-brand-accentPrimary">copy sucks.</span>
      </h1>

      {/* Heading2 */}
      <p className="text-heading2 text-brand-text max-w-[60rem] mt-12 mb-2 text-center">
      Build super high-converting landing page <br /> with  <span className=" text-brand-accentPrimary">crystal-clear copy</span> in minutes. 
      </p>
      
      {/* <p className="text-heading2 font-medium text-brand-text max-w-[60rem] mt-14 mb-6 text-center">
      Lessgo.ai uses its <span className =""> Conversion Intelligence Engine </span> to create your landing page <span className ="font-medium"> in under 5 minutes </span> with <span className ="font-bold text-brand-accentPrimary">copy so sharp </span>it sells itself.
      </p>
       */}
        <WaitlistForm />
      
      
        <p className="text-sm md:text-lg font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-4 mb-20 md:mb-2 text-center">
      [<span className= "font-bold">Only 10 Spots Left</span> - <span className=" font-semibold text-brand-accentPrimary"> 1 Year Free </span> Pro - Launching May 7]  <span className="underline text-brand-accentPrimary"></span>
      </p>


      <p className="text-heading4 font-medium text-brand-mutedText max-w-[60rem] mt-10 mb-20 text-center hidden sm:block">
      Describe your idea in one line. Watch Lessgo.ai craft your <span className="font-semibold">$5K-quality landing page</span> with both copy and design in minutes. Its Conversion Intelligence Engine tailors every word and layout to maximize leads, sign-ups and sales.


      </p>

      {/* {!showForm && (
        <CTAButton
          gaLabel="01 hero-section"
          onClick={(e) => {
            e.preventDefault(); // If you're still using <a> in CTAButton
            setShowForm(true); // ✅ Toggle the form
          }}
        />
      )}

      {showForm && <WaitlistForm />} */}

      

      

      
      <div className="min-h-screen bg-brand-highlightBG bg-opacity-60 flex flex-col items-center justify-center mt-12 pb-8">
      {/* Headline */}
      <h1 className="text-4xl md:text-5xl font-bold text-center max-w-4xl leading-tight mt-6 md:mt-2">
        Imagine having a landing page that converts 50% of your visitors <br /><span className="text-2xl font-normal">without needing daily tweaks, edits, or guesswork.</span>
      </h1>

      {/* Before and After Cards */}
      <div className="mt-12 flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        {/* Before */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex-1">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Before</h2>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Frustrating Guesswork, Wasted Time, Zero Traction
          </h3>
          <ul className="space-y-4 text-base text-brand-mutedText">
            <li className="flex items-start">
              <span className="h-2 w-2 bg-gray-500 rounded-full mt-2 mr-3"></span>
              Hours lost tweaking pretty templates that don’t sell
            </li>
            <li className="flex items-start">
              <span className="h-2 w-2 bg-gray-500 rounded-full mt-2 mr-3"></span>
              AI tools spitting the same bland, zombie copy everyone else uses
            </li>
            <li className="flex items-start">
              <span className="h-2 w-2 bg-gray-500 rounded-full mt-2 mr-3"></span>
              Endless drag-and-drop loops that feel like death by 1000 cuts
            </li>
            {/* <li className="flex items-start">
              <span className="h-2 w-2 bg-gray-500 rounded-full mt-2 mr-3"></span>
              Landing pages that confuse, bore, and bounce your best prospects
            </li>
            <li className="flex items-start">
              <span className="h-2 w-2 bg-gray-500 rounded-full mt-2 mr-3"></span>
              Launch anxiety every time you hit “Publish” (because you’re not even sure it’s right)
            </li> */}
          </ul>
        </div>

        {/* After */}
        <div className="bg-brand-logo rounded-2xl shadow-lg p-8 text-white flex-1">
          <h2 className="text-sm font-semibold text-white mb-2">After</h2>
          <h3 className="text-2xl font-bold mb-6">
            Confident Launches, Persuasive Pages, Real Conversions
          </h3>
          <ul className="space-y-4 text-base">
            <li className="flex items-start">
            <Check className="text-white h-5 w-5 mr-3 mt-1" />
              
              One smart sentence input → your full landing page is born
            </li>
            <li className="flex items-start">
            <Check className="text-white h-5 w-5 mr-3 mt-1" />
              Copy crafted from real market research, not fantasy hooks
            </li>
            <li className="flex items-start">
            <Check className="text-white h-5 w-5 mr-3 mt-1" />
              Layout built to flow like a sales conversation, not a portfolio
            </li>
            {/* <li className="flex items-start">
            <Check className="text-white h-5 w-5 mr-3 mt-1" />
              Launch in minutes, not weeks… without ever touching a blank page
            </li>
            <li className="flex items-start">
            <Check className="text-white h-5 w-5 mr-3 mt-1" />
              Zero second-guessing. Zero template regret. Just traction.
            </li> */}
          </ul>
        </div>
      </div>
    </div>


   
    <section className="py-20 bg-white flex flex-col items-center px-6 mt-24">
      {/* Headline */}
      <h2 className="text-4xl md:text-5xl font-bold text-center max-w-4xl leading-tight">
        You're <span className="text-brand-accentPrimary">three simple steps</span> away from your dream landing page
      </h2>

      {/* Steps */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl w-full">
        
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center px-4">
      {/* Icon with soft background */}
      <div className="bg-brand-highlightBG text-brand-accentPrimary rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <Lightbulb className="w-8 h-8" />
      </div>

      {/* Step number */}
      <div className="text-sm text-brand-accentPrimary font-semibold mb-2">
        Step 1
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-brand-text mb-3">
        Describe your idea
      </h3>

      {/* Body */}
      <p className="text-brand-mutedText text-sm max-w-xs">
        Share your idea in a single line — what it is, the problem it solves, and who it’s for.
      </p>
    </div>

{/* Step 2 */}
<div className="flex flex-col items-center text-center px-4">
  {/* Icon */}
  <div className="bg-brand-highlightBG text-brand-accentPrimary rounded-full w-16 h-16 flex items-center justify-center mb-4">
    <LayoutTemplate className="w-8 h-8" />
  </div>

  {/* Step number */}
  <div className="text-sm text-brand-accentPrimary font-semibold mb-2">
    Step 2
  </div>

  {/* Title */}
  <h3 className="text-xl font-bold text-brand-text mb-3">
    Get a landing page
  </h3>

  {/* Body */}
  <p className="text-brand-mutedText text-sm max-w-xs">
    Lessgo.ai will research your market, define your positioning, craft your big idea, and deliver a high-converting landing page.
  </p>
</div>


{/* Step 3 */}
<div className="flex flex-col items-center text-center px-4">
  {/* Icon */}
  <div className="bg-brand-highlightBG text-brand-accentPrimary rounded-full w-16 h-16 flex items-center justify-center mb-4">
    <Rocket className="w-8 h-8" />
  </div>

  {/* Step number */}
  <div className="text-sm text-brand-accentPrimary font-semibold mb-2">
    Step 3
  </div>

  {/* Title */}
  <h3 className="text-xl font-bold text-brand-text mb-3">
    Edit and publish
  </h3>

  {/* Body */}
  <p className="text-brand-mutedText text-sm max-w-xs">
    Make minor tweaks if you like — then publish. It’s that simple.
  </p>
</div>


      </div>
    </section>












<div className="mb-24 max-w-5xl mx-auto text-body space-y-10 leading-relaxed pt-16">

  <section className="bg-brand-highlightBG pt-12 pb-24 rounded-xl shadow-sm">

    {/* Heading */}
    <p className="text-4xl md:text-5xl text-center font-bold pb-20">
      Why I Quit My $150k Job to Build This
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
      <div className="w-full lg:w-1/2 space-y-6 text-lg md:text-2xl text-brand-mutedText">

        <p className="">Hi, I’m Sushant. A 35-year-old indie hacker from Amsterdam.</p>

        <p>I’m an AI engineer who fell in love with copywriting four years ago.</p>

        <p>After failing multiple side projects, I realized something:</p>

        <p className="font-semibold text-primary">
        Copywriting was the missing link between technical founders... and real success.
        </p>

        <p>Now, my only mission is to use AI to give marketing superpwoer to technical founders like me </p>

      </div>
    </div>

    

  </section>

</div>






      {/* </div> */}

      
     


      

          





  
      
      <div className="mb-12 max-w-3xl mx-auto text-body leading-relaxed space-y-12 pt-24">

      <div className="text-center bg-brand-highlightBG border-2 border-brand-logo border-solid rounded-xl p-10 space-y-8 shadow-sm">

<h2 className="text-heading2 font-bold">
  Grab Your Early Access - Before The Last 10 Spots Are Gone
</h2>

  

    {/* Benefits List */}
    <ul className="pl-6 space-y-4 text-left max-w-md mx-auto">
      <li className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-1" />
        <span className="text-[1.05rem]">1 Year of Pro Features — Free</span>
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

 



          <WaitlistForm />
      
          <p className="text-sm md:text-lg font-body italic text-brand-text max-w-[60rem] mt-8 md:mt-6 mb-20 text-center">
      [<span className= "font-bold">Only 10 Spots Left</span> - <span className=" font-semibold text-brand-accentPrimary"> 1 Year Free </span> Pro - Launching May 7]  <span className="underline text-brand-accentPrimary"></span>
      </p>
  
      </div>

      </div>


          {/* Footer */}
          <footer className="text-center text-brand-mutedText text-sm mt-12">
            <p>© 2025 Lessgo.AI. All rights reserved.</p>
          </footer>
          
        
    

  
    </main>
    </>
  );
}
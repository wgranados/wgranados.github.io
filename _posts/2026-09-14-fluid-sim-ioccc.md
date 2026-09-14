---
date: 2026-09-14
layout: post
slug: fluid-sim-ioccc
title: "Running a 2012 IOCCC winner in a browser tab: WebAssembly, Web Workers, and a real terminal"
description: "How the arcade's Fluid Sim game works: compiling an obfuscated C fluid simulator to WebAssembly, running it in a Web Worker, and rendering its raw ANSI frames with xterm.js."
categories:
- web
- tooling
tags:
- webassembly
- emscripten
- ioccc
- astro
- arcade
---

The [IOCCC](https://www.ioccc.org/) — the International Obfuscated C Code Contest — has been rewarding beautifully unreadable C since 1984. One of my favorite winners is [endoh1.c](https://github.com/ioccc-src/winner/blob/master/2012/endoh1/endoh1.c), Yusuke Endoh's 2012 entry: a full SPH (smoothed-particle hydrodynamics) fluid simulator, rendered live as ANSI art in your terminal, in well under a kilobyte of source. I recently added it to [the arcade](/arcade/fluid/) on this site, unmodified, running entirely client-side with WebAssembly (a tool I heard of during university). See the original code in-action below, it's really really cool and a real flex for a progammer! 

<!--more-->


<div style="max-width:100%;">
  <iframe src="https://www.youtube.com/embed/QMYfkOtYYlg" title="ASCII fluid dynamics -- IOCCC2012 endoh1.c" style="width:100%;aspect-ratio:16/9;height:auto;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

## Compiled to WebAssembly, run in a Worker

`endoh1.c` is C99 with `complex` types and `usleep`—not something Jekyll or Astro's CI can build (no C toolchain in the pipeline), so the wasm isn't built on every deploy. It's compiled once, locally, via Emscripten in Docker, and the output—`fluid.mjs` and `fluid.wasm`—is committed straight into the repo like any other static asset.

The obfuscated source's `main()` never returns—it loops forever, redrawing a frame each iteration, paced in the original by `usleep()`. This build has no Asyncify support for blocking sleep, so `usleep` is a no-op here: the simulation runs flat-out, as fast as the CPU allows. That's why it's confined to a **Web Worker**—a full-speed forever-loop is fine there, it just can't touch the DOM or block the page. `FluidGame.tsx` terminates the Worker on "Stop" and before every new pour; that's the only way to interrupt a `main()` that was never designed to exit.

Feeding it is the fun part. Emscripten lets you swap `stdin`/`stdout` for plain callbacks:

{% highlight ts %}
createFluidModule({
  stdin: () => (idx < text.length ? text.charCodeAt(idx++) : null),
  print: onOutputLine,
});
{% endhighlight %}

The scene you draw becomes the program's stdin, character by character—no filesystem shim needed. Every line it prints comes back through `print`, which is really the program painting raw ANSI escape codes as if it had a real terminal underneath—so on the main thread, [xterm.js](https://xtermjs.org/) (the same terminal emulator VS Code uses) renders each frame exactly as a real terminal would, instead of me reimplementing ANSI parsing myself.

## The source is the real headline

Everything above is plumbing. The actual impressive part is the 20 lines this all sits on top of, reproduced here in full because it deserves to be read, not just linked to. Figuring out how it works is left as an exercise for the reader—I'll just say that between the physics, the self-reference, and the fact it's typeset to spell "IOCCC 2012 winner" down the right margin in 80 columns, Endoh wasn't just entering a contest. He was taking a victory lap.

{% highlight c %}
#  include<stdio.h>//  .IOCCC                                         Fluid-  #
#  include <unistd.h>  //2012                                         _Sim!_  #
#  include<complex.h>  //||||                     ,____.              IOCCC-  #
#  define              h for(                     x=011;              2012/*  #
#  */-1>x              ++;)b[                     x]//-'              winner  #
#  define              f(p,e)                                         for(/*  #
#  */p=a;              e,p<r;                                        p+=5)//  #
#  define              z(e,i)                                        f(p,p/*  #
## */[i]=e)f(q,w=cabs  (d=*p-  *q)/2-     1)if(0  <(x=1-      w))p[i]+=w*/// ##
   double complex a [  97687]  ,*p,*q     ,*r=a,  w=0,d;    int x,y;char b/* ##
## */[6856]="\x1b[2J"  "\x1b"  "[1;1H     ", *o=  b, *t;   int main   (){/** ##
## */for(              ;0<(x=  getc (     stdin)  );)w=x  >10?32<     x?4[/* ##
## */*r++              =w,r]=  w+1,*r     =r[5]=  x==35,  r+=9:0      ,w-I/* ##
## */:(x=              w+2);;  for(;;     puts(o  ),o=b+  4){z(p      [1]*/* ##
## */9,2)              w;z(G,  3)(d*(     3-p[2]  -q[2])  *P+p[4      ]*V-/* ##
## */q[4]              *V)/p[  2];h=0     ;f(p,(  t=b+10  +(x=*p      *I)+/* ##
## */80*(              y=*p/2  ),*p+=p    [4]+=p  [3]/10  *!p[1])     )x=0/* ##
## */ <=x              &&x<79   &&0<=y&&y<23?1[1  [*t|=8   ,t]|=4,t+=80]=1/* ##
## */, *t              |=2:0;    h=" '`-.|//,\\"  "|\\_"    "\\/\x23\n"[x/** ##
## */%80-              9?x[b]      :16];;usleep(  12321)      ;}return 0;}/* ##
####                                                                       ####
###############################################################################
**###########################################################################*/
{% endhighlight %}

CC BY-SA 4.0 via the [IOCCC winners archive](https://github.com/ioccc-src/winner).


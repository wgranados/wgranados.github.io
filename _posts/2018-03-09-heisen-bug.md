---
comments: true
date: 2018-03-09
layout: post
slug: heisenbug 
title: Infamous Heisenbug 
categories:
- Competitive Programming
- General Programming
tags:
- Programming
- Mathematics 
- Compiler Optimization 
- Heisenbug 
---
<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

Solution for [NOI00P1 - Cermaic Necklace](http://wcipeg.com/problem/noi00p1) 
[Heisenbugs](https://en.wikipedia.org/wiki/Heisenbug) are quite interesting but often people will have never heard of the terminology or better yet, experience it in practice.  Well today I will show you a heisenbug I encountered while solving a contest problem. This problem had me scratching my head until I had to ask [Alex Li](http://alexli.ca) during [PEG](https://en.wikipedia.org/wiki/Woburn_Collegiate_Institute#Programming_Enrichment_Group_.28PEG.29).  

This problem is quite trivial after you look through the distracting diagrams. The jist of the problem is that we need to find the largest disk which can be created with the provided variables $$\color{white}{V_0}$$ and $$\color{white}{V_{total}}$$. 

**Offending solution**
{% highlight c++ linenos %}
#include <iostream>
#include <cstdio>
#include <cmath>
using namespace std;

int V,V0,disks,cnt;
double best = 0.0, len = 0.0;

int main() {
    freopen("input.txt","r",stdin);
    scanf("%d%d",&V,&V0);
    //printf("%d %d\n",V,V0);
    for(int i = 1;i <= (int)V/V0;i++){
        len = i*0.3*sqrt((double)V/i-V0);
        //printf("%d %.2f\n",i,len);
        if(len > best){
            best  = len;
            disks = i;
            cnt   = 1;
        }
        else if(len == best){
            cnt++;
        }
    }
    //printf("%d\n",cnt);
    printf("%d\n", (cnt > 1) ? 0:disks);
    return 0;
}
{% endhighlight c++ %}

**Input, compilation, and output**
{% highlight shell %}
cat input.txt
10
2
g++ heisenbug.cpp -o heisenbug && time ./heisenbug
3

real    0m0.002s
user    0m0.001s
sys     0m0.000s
{% endhighlight shell %}


So what's wrong with this solution? Logically it makes sense, it just doesn't seem to produce the correct answer. More concerning is that when we try debugging the program by printing out each variable we notice that the problem seemingly disapears and produces the correct answer, witchcraft I say! 

The issue arises due to C++'s compilation optimizations. The quick fix to this problem is to change the following: 
{% highlight c++ %}
volatile double best = 0.0, len = 0.0;
{% endhighlight c++ %}

Why does this work? And what does the volatile keyword do exactly? Here's a concise definition from [Wikipedia](https://en.wikipedia.org/wiki/Volatile_(computer_programming)).

> The volatile keyword indicates that a value may change between different accesses, even if it does not appear to be modified. This keyword prevents an optimizing compiler from optimizing away subsequent reads or writes and thus incorrectly reusing a stale value or omitting writes.

After reading this the problem becomes quite trivial to explain. During compilation C++ took some liberties and assumed that the variable **len** would not change between accesses. Hence it used a stale/old value of the variables when evaluated the inequalities, thus resulting in an incorrect answer. The volatile keywords now forces the compiler to check the value at the memory registy every time the variable is reffered to, thus fixing the issue.

**Input, compilation, and output with modification**
{% highlight shell %}
cat input.txt
10
2
g++ heisenbug.cpp -o heisenbug && time ./heisenbug
0

real    0m0.002s
user    0m0.001s
sys     0m0.000s
{% endhighlight c++ %}

It would seem our little fix worked! Now, some food for thought, why don't we always use the volatile keyword? Clearly this problem should be affecting all our programs! Well that's not entirely true. In general the C++ compiler is quite smart and for most cases actually manages to optimize correctly.

Another major point is that forcing the C++ compiler to manually check the value at the registry every time it compiles will cause our program/software to slowdown since it is quite tasking. So make sure to use the volatile keyword sparingly. 

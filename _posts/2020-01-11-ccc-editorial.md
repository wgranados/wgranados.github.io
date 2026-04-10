---
comments: true
date: 2020-01-10
layout: post
slug: ccosolutions
title: CCC/CCO Selected Solutions (2010-2014)
categories:
- Competitive Programming
- General Programming
tags:
- Programming
- Canadian Computing Competition
- Canadian Computing Olympiad
---

<script type="text/javascript" async
  src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML">
</script>

# Introduction

I actually wrote all of editurials when I was in highschool, and had them on my old blog. 
I removed it because I couldn't find a good way to organize it at the time, but now I have a better idea. 
I hope anyone thinking of competiting in this competition will find these useful :) 

# Table of Contents

# Solution for [CCC10S3 - Firehose](http://wcipeg.com/problem/ccc10s3)

This problems asks us to find the minimum length of hose required to connect a series of houses if were only given K fire hydrants from which to extend our hose from. We must then take into consideration the maximum hose length possible is 1,000,000, because this number is so large we know that a simple iterative solution will likely not run in time. What we need to notice is that once we have found one possible hose length that satisfies the condition above we do not need to consider hose lengths that are longer, likewise we also have to notice that if the current hose length does not satisfy the conditions then all hose lengths less than this hose length are also impossible. Once we see this property the problem becomes a trivial binary search problem, we're using binary search on the hose length.
te

Now that this idea has been formulated we must define a predicate. The predicate should be if the current hose length is possible then the upper bound is now the hose length, otherwise the lower bound is now equal to the hose length. In provided solution the predicate written has a time complexity of $$O(H^2)$$ where $$H$$ is the number of houses and the binary search has a time complexity of $$O(\log{}L)$$ where $$L$$ is the length of the hose.

Time complexity: $$O(H^2\log{}L)$$

{% highlight c++ linenos %}
#include<iostream>
#include<cstdio>
#include<cstring>
#include<vector>
#include<algorithm>
using namespace std;

const int MAXH = 1000;
int H,K,lo,hi,mid;
vector<int>house;
bool v[MAXH];


/*minimum between distance taking wrapping into consideration*/
int dist(int h1,int h2){
  return min(h2-h1,(int)1e6-h2+h1);
}

/* Places a hydrant hose_len units away from the current house. 
 * For all houses in front of the current house, if their 
 * distance from the current house is * less than or equal to
 *  2*hose_len meaning they are either on the left side of the 
 * hydrant (placed hose_len units ahead of the current house) or on the 
 * right side of the hydrant (hence the extra hose_len) then they 
 * are marked as visisted.
 */
bool predicate(int hose_len,int k_left = K,int h_left = H){
  memset(v,false,sizeof(v));
  for(int i = 0;i < (int)house.size() && h_left > 0 && k_left > 0;++i){
      if(v[i])
        continue;
      else{
        k_left--,h_left--,v[i] = true;
        for(int k = (i+1)%H;k < (int)house.size();++k){
            if(!v[k] && dist(house[i],house[k]) <= 2*hose_len)
                h_left--,v[k] = true;
            else
                break;
        }
      }
  }
  return (h_left == 0) ? true:false;
}

int main(){
    scanf("%d",&H);
    for (int i = 0,j = 0; i < H; ++i){
      scanf("%d",&j);
      house.push_back(j);
    }
    sort(house.begin(),house.end());
    scanf("%d",&K);
    lo = 0,hi = (int)1e6,mid = (lo+hi)/2;
    while(lo < hi){
        // this hose length works so it's now the upper bound
        if(predicate(mid))
            hi = mid;
        // this hose length is too short
        else              
            lo = mid+1;
        mid = (lo+hi)/2;
    }
    printf("%d\n",mid);
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC10S4 - Animal Farm](http://wcipeg.com/problem/ccc10s4)

This problem asks of us to find the minimum spanning tree of the graph where the pens are considered the nodes. First we must construct the graph since we are not given the graph required; instead we are given the corners of the pens. This must be done carefully since we need to ensure that any edge that only connects two pens connects these two pens, and any edge connecting one is actually connected this pen with the outside (which is another node in the graph). It is also important to note that it is not always possible that the graph is connected to the outside node (implying the graph is not connected). This is why it will be relatively trivial to use Prim’s algorithm for finding the minimum spanning since Prim’s can detect if a graph is connected or not automatically. Unlike Kruskal’s Algorithm which requires some more legwork (left as an exercise for the reader).

In the provided implementation we the time complexity for constructing the graph is $$O(N^2)$$ where $$N$$ is the number of pens, and the time complexity for finding the minimum spanning tree is $$O(N^2\log{}N)$$.

Time Complexity: $$O(N^2\log{}N)$$
{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
using namespace std;

struct corners{
    int w,pen1,pen2;
};

const int MAXN = 500,INF = 0x3F3F3F3F;
int N,E;

corners c[MAXN][MAXN];
vector<pair<int,int>>adj[MAXN];
bool v[MAXN];

int prim(int n){
    priority_queue<pair<int,pair<int,int>>>pq;
    int MSTNodes = 1, totWeight = 0;
    for(int i = 0; i < adj[1].size();i++){
        if(adj[1][i].x <= n){
            pq.push(mp(-adj[1][i].y,mp(1,adj[1][i].x)));
        }
    }
    memset(v,false,sizeof v);
    v[1] = true;
    while(MSTNodes < n && !pq.empty()){
        int w = -pq.top().x;
        int sn = pq.top().y.x;
        int en = pq.top().y.y;
        pq.pop();
        if(v[sn] && !v[en]){
            MSTNodes++;
            totWeight+=w;
            v[en] = true;
            for(int i = 0; i < adj[en].size();i++){
                if(adj[en][i].x <= n){
                    pq.push(mp(-adj[en][i].y,mp(en,adj[en][i].x)));
                }
            }
        }
    }
    return MSTNodes == n ? totWeight:INF;
}

int main(){
    scanf("%d",&N);
    for(int i = 0; i < MAXN;i++){
        for(int j = 0; j < MAXN;j++){
            c[i][j].w = c[i][j].pen1 = c[i][j].pen2 = INF;
        }
    }
    for(int i = 0; i < N;i++){
        scanf("%d",&E);
        int tc[E],w[E];
        for(int j = 0; j < E;j++)
            scanf("%d",&tc[j]);
        for(int j = 0; j < E;j++)
            scanf("%d",&w[j]);
        for(int j = 0; j < E;j++){
            int corner[] = {tc[j],tc[(j+1)%E]};
            sort(corner,corner+2);
            if(c[corner[0]][corner[1]].pen1 == INF)
                c[corner[0]][corner[1]].pen1 = i+1;
            else
                c[corner[0]][corner[1]].pen2 = i+1;
            c[corner[0]][corner[1]].w = w[j];
        }
    }
    for(int i = 0; i < MAXN;i++){
        for(int j = 0; j < MAXN;j++){
            // not connected to outside because declared twice
            if(c[i][j].pen1 != INF && c[i][j].pen2 != INF){
                adj[c[i][j].pen1].pb(mp(c[i][j].pen2,c[i][j].w));
                adj[c[i][j].pen2].pb(mp(c[i][j].pen1,c[i][j].w));
            }
            // connected to outside because declared once
            else if(c[i][j].pen1 != INF && c[i][j].pen2 == INF){
                adj[c[i][j].pen1].pb(mp(N+1,c[i][j].w));
                adj[N+1].pb(mp(c[i][j].pen1,c[i][j].w));
            }
        }
    }
    int ans1 = prim(N),ans2 = prim(N+1);
    printf("%d\n",min(ans1,ans2));
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC10S2P1 - Barking Dogs](http://wcipeg.com/problem/ccc10s2p1)

This problem asks us to keep track events that come from $$D$$ dogs, over a time interval $$T$$. Then we must simulate the problem as specified in the statement. One has to be very careful with how they implement this because this problem is very easy to misinterpret or make silly mistakes.

Time complexity: $$O(TD)$$

{% highlight c++ linenos %}
nclude<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 1
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
using namespace std;

const int MAXD = 1000;
const int SLEEPING = -1,WAITING = 1,BARKING = 0;
int D,F,T;
int state[MAXD];
int wait[MAXD];
int timer[MAXD];
int cnt[MAXD];
bool v[MAXD];

vector<int>adj[MAXD];

void update(int dog){
   for(int i = 0;i < (int)adj[dog].size();i++){
       if(state[adj[dog][i]] == SLEEPING){
          state[adj[dog][i]] = WAITING;
          timer[adj[dog][i]] = wait[adj[dog][i]];
       }
   }
}
int main(){
    cin >> D;
    for(int i = 0;i < D;i++){
        cin >> wait[i];
    }
    cin >> F;
    for(int i = 0,a,b;i < F;i++){
       cin >> a >> b;
       adj[--a].pb(--b);
    }
    cin >> T;
    memset(state,SLEEPING,sizeof(state));
    memset(timer,SLEEPING,sizeof(timer));
    state[0] = BARKING;
    timer[0] = 0;
    for(int t = 0;t <= T;t++){
       for(int dog = 0;dog < D;dog++){
           if(timer[dog] == 0){
              cnt[dog]++;
              update(dog);
           }
       }
       for(int dog = 0;dog < D;dog++){
           timer[dog]--;
           if(timer[dog] == 0)state[dog] = BARKING;
           if(timer[dog] <  0)state[dog] = SLEEPING;
           if(timer[dog] >  0)state[dog] = WAITING;
       }
    }
    for(int dog = 0;dog < D;dog++)
        cout << cnt[dog] << endl;
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC10S2P3 - Wowow](http://wcipeg.com/problem/ccc10s2p3)

This problem asks us to handle a ranking system where we have to update a person’s score and query for the Kth ranked person.

Although this problem was intended to be solved with an offline solution that incorporates a binary indexed tree, today I will go over the solution which uses an order statistic tree. An order statistic tree is special tree that has the same characteristics of a binary search tree, but with the added functionality of being able to query for the Kth ranked element in the tree. The main idea for handling ranked based queries on an ordered statistic tree is to at every node to keep the number of children in its left and right sub-tree. Then when we search through an element every time we go left in the sub-tree we add the value of the current node’s right sub-tree – since the number of elements in the right sub-tree are the number of elements that are larger than the queried element.

In addition to this we also are required to keep the tree balanced otherwise the tree degenerates into a linked list where the time per query is $$O(N)$$ resulting in an overall complexity of $$O(QN)$$ instead of $$O(Qlog{}N)$$. Luckily the built in Ordered Statistics Tree uses a red black tree for its implementation.



Time Complexity: $$O(Q\log{}N)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
using namespace std;
using namespace __gnu_pbds;

typedef tree<
  int,
  null_type,
  greater<int>,
  rb_tree_tag,
  tree_order_statistics_node_update>
set_t;

int N,X,R,K,n;
char cmd;
map<int,int>user,score;
set_t s;

int main(){
    scanf("%d",&N);
    for(int i = 0;i < N;++i){
      scanf(" %c",&cmd);
      if(cmd == 'N'){
        scan(X);
        scan(R);
        user[X] = R;
        score[R] = X;
        s.insert(R);
      }
      else if(cmd == 'M'){
        scanf("%d%d",X,R);
        s.erase(user[X]);
        score.erase(user[X]);
        user[X] = R;
        score[R] = X;
        s.insert(R);
      }else{
        scan(K);
        printf("%d\n",score[*s.find_by_order(K-1)]);
      }
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC10S2P2 - Tree Pruning](http://wcipeg.com/problem/ccc10s2p2)

This problem asks us to find the minimum amount of prunes - or sub-trees needed to be removed- to make the difference between the black and white nodes in a tree to be exactly a value D. In-order to accomplish this we must use dynamic programming.

First we must define our dynamic state. In this solution we define the first dimension of our DP array to be the nodes, and the second dimension to be the difference between the black and white nodes in this sub tree, and the value of this index is the minimum amount of prunes required to reach this state.

$$DP[node][B-W] = \text{minimum number of prunes}$$

In-order to fill this DP array we must traverse through the tree and progressively fill the DP array. There are serveral cases that need to be considered when doing this.

**Case 0:**
No prunes are done on this sub tree, so


$$DP[node][\text{left subtree+right subtree+node}] = 0$$

**Case 1:**
One prune is required to make this whole sub-tree equal to 0, so


$$DP[node][0] = 1$$

**Case 2:**
If the current node only has one child then the difference for this subtree are the possible diffrence for this subtree's one child minus itself so,


$$DP[node][i+type[node]] = min(itself, DP[child][i])$$

**Case 3:**
If the current node has two children the the differences for this subtree are possible differences in its left subtree plus the differences in its right subtree.


$$DP[node][i+j+type[node]] = min(itself, DP[child1][i]+DP[child2][j])$$


Time Complexity : $$O(N)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x) (x).begin(),(x).end()
#define f(x) (x)+300
#define x first
#define y second
using namespace std;

const int MAXN = 1000,inf = 0x3f3f3f3f,B = 0,W = 1;
int N,D;
int type[MAXN];
int dp[MAXN][MAXN];
vector<int>adj[MAXN];


int F(int x){
    return x+350;
}

int dfs(int n){
	// left subtree, right subtree
    int tree[2] = {0,0};
    int children = (int)adj[n].size();
    for(int i = 0;i < children;i++){
        tree[i] = dfs(adj[n][i]);
    }
	// the normal tree requires 0 prunes
    dp[n][F(tree[0]+tree[1]+type[n])] = 0;
    // pruning the entire subtree requires 1 prune
    dp[n][F(0)] = 1;
    if(children == 1){
        // dp[n][i+type[n]] = minimum of itself and the dp[child][i]
        // for example dp[0][-300+1] = min(dp[0][-300+1],dp[1][-300])
        // this is because -300+1 = 299
        for(int i = -300;i <= 300;i++)
            dp[n][F(i+type[n])] = min(dp[n][F(i+type[n])],
                                      dp[adj[n][0]][F(i)]);
    }
    else if(children == 2){
        // dp[n][i+type[n]] = min(itself, it's to children which add up to i)
        for(int i = -300;i <= 300;i++) {
            for(int j = -300;j <= 300;j++) {
                // if it's impossible for any branch to reach a sum (i or j)
                // then it's impossible to make i+j
               if(dp[adj[n][0]][F(i)] != inf && dp[adj[n][1]][F(j)] != inf){
                  dp[n][F(i+j+type[n])] = min(dp[n][F(i+j+type[n])],
                                              dp[adj[n][0]][F(i)]
                                              + dp[adj[n][1]][F(j)]);
			   }
			}
		}
    }
	// return the left subtree,right subtree, and itself
    return tree[0]+tree[1]+type[n];
}

int main(){
    scanf("%d%d",&N,&D);
    memset(dp,inf,sizeof(dp));
    for(int i = 0,id,cl,ch;i < N;i++){
        scanf("%d%d%d",&id,&cl,&ch);
        type[id] = (cl == W) ? 1:-1;
        for(int j = 0,nd;j < ch;j++){
            scanf("%d",&nd);
            adj[id].pb(nd);
        }
    }
    dfs(0);
    if(dp[0][F(D)] >= inf)
       printf("-1\n");
    else
       printf("%d\n",dp[0][F(D)]);
    return 0;
}

{% endhighlight c++ %}

# Solution for [CCC10S2P4 - Computer Purchase Return](http://wcipeg.com/problem/ccc10s2p4)

This problem asks us to build the best computer from a random assortments under a restriced budget. 
To solve this we must use Dynamic Programming, so the begin we should define our dynamic state.
In this case it will be:

$$DP[budget][\text{item number}]$$

Now we iterate over all of the possible combinations and store it in our DP state. However it is important to noitce that $$DP[\text{i+cost}][j]$$ is only possible if if the previous element $$DP[i][j-1]$$ is possible.


Time Complexity: $$O(TB)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
using namespace std;

const int MAXT = 10,MAXB = 10000;
int T,N,B,best;
int dp[MAXB][MAXT];
vector<pair<int,int>>adj[MAXT];// cost,value

int main(){
   scanf("%d%d",&T,&N);
   memset(dp,0,sizeof(dp));
   for(int i = 0,c,v,t;i < N;++i){
       scanf("%d%d%d",&c,&v,&t);t--;
       adj[t].pb(mp(c,v));
   }
   scanf("%d",&B);
   for(int i = 0;i < (int)adj[0].size();i++){
       dp[adj[0][i].x][0] = max(dp[adj[0][i].x][0],adj[0][i].y);
   }
   for(int t = 1;t < T;t++){
       for(int i = 0;i < (int)adj[t].size();i++){
           for(int j = 0;j <= B;j++){
               if(dp[j][t-1] != 0){
                  dp[j+adj[t][i].x][t] = max(dp[j+adj[t][i].x][t],
                                             dp[j][t-1]+adj[t][i].y);
               }
           }
       }
   }
   for(int i = 0;i <= B;i++){
       best = max(best,dp[i][T-1]);
   }
   printf("%d\n",best == 0 ? -1:best);
   return 0;
}
{% endhighlight c++ %}


# Solution for [CCC10S2P5 - Space Miner](http://wcipeg.com/problem/ccc10s2p5)

This problem asks us to follow a jagged path created by connecting $$N$$ points a space ship visits (in sequential order) and to check through our  $$M$$ planets, denoted $$M_i$$, to see if they are within $$D+r_i$$ units from any line segment on this path. In-order to solve this we have to use 3D vector mathematics to define each line segment on the path, and a line segment for each planet respective to the path. Then for each segment we should consider the three possible orientations any planet can appear in relative to the path.

**Orientation 1:**
<img style="float: right;" width="80" height="80" src="/images/orentiation1.jpg">
The planet does not fall within the boundaries of the line segment, and its vector projection onto the line segment is opposite to the line segment's direction, and it's to the left. In this case the distance is just equal ot the magnitude of the vector formed from the beginning of the line segment to the planet.

**Orientation 2:**
<img style="float: right;" width="80" height="80" src="/images/orentiation2.jpg">
This planet does not fall within the boundaries of the line segment, and its vector projection onto the line segment is opposite to the line segment's direction, and it's to the right. In this case the distance is just equal to the magnitude of the vector formed from the end of the line segment ot the planet.

**Orientation 3:**
<img style="float: right;" width="80" height="80" src="/images/orentiation3.jpg">
The planet does fall within the boundaries of the line segment, so its distance is equal to the area of the parallelogram made from the cross product of the line segment and the vector towards the planet divided by the magnitude of the line segment (the base). In the following equation the vector $$S$$ is the line segment on the path, and $$P$$ is the vector formed the line segment to the planet $$P$$.

$$d=\frac{|S*P|}{|S|}$$

Time Complexity: $$O(MN)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
using namespace std;

struct vector3D{
     double x,y,z;
     vector3D(){
        x = y = z = 0;
     }
     vector3D(double _x,double _y,double _z){
          x = _x,y = _y,z = _z;
     }
     // misceallanous
     double magnitude(){
        return sqrt(x*x+y*y+z*z);
     }
     vector3D unit_vector(){
        return (vector3D){x/this->magnitude(),y/this->magnitude(),
                          z/this->magnitude()};
     }
     // operators
     void operator = (const vector3D&v){
          x = v.x;
          y = v.y;
          z = v.z;
     }
     // vector addition
     vector3D operator + (const vector3D&v){ 
         return (vector3D){x+v.x,y+v.y,z+v.z};
     }
     //vector subtraction
     vector3D operator - (const vector3D&v){
         return (vector3D){x-v.x,y-v.y,z-v.z};
     }
     # vector multiplication
     vector3D operator * (const vector3D&v){
        return (vector3D){y*v.z - z*v.y, z*v.x - x*v.z, x*v.y - y*v.x};
     }
     // dot product
     double operator ^ (const vector3D&v){
          return x*v.x + y*v.y + z*v.z;
     }

};

struct planet{
   int v,r;
   vector3D p;
   planet(double x,double y, double z,int _v,int _r){
      v = _v, r = _r;
      p = (vector3D){x,y,z};
   }
};

struct gate{
  vector3D p;
  gate(double x,double y, double z){
     p = (vector3D){x,y,z};
  }
};

const int MAXM = 1000;
int M,N,D;
bool vis[MAXM];
vector<planet>planets;
vector<gate>gates;

bool within_range(gate one,gate two,planet pt){
    vector3D v0 = two.p-one.p;
    vector3D v1 = pt.p-one.p;
    vector3D v2 = pt.p-two.p;
    if( (v1 ^ v0) < 0){
       // the projection of the vector lies outside the line segment
       // and counter clockwise to the line segment. So we just take
       // the magnitude of v1
       if(v1.magnitude() <= pt.r+D )
          return true;
       else
          return false;
    }
    if( (v2^v0) > 0){
       // the projection of the vector lies outside the line segment
       // and lockwise to the line segment. So we just take
       // the magnitude of v2
       if(v2.magnitude() <= pt.r+D)
          return true;
       else
         return false;
    }
    // the point is within the boundaries of the vector so we take the 
    // cross product of v0 and v1 to get the area of the parrelogram then
    // we divide it by its base to get the height. Which in this case is 
    // the distance from the line
    if( (v0*v1).magnitude()/v0.magnitude() <= pt.r+D )
        return true;

    return false;
}

int main(){
    cin >> M;
    for(int i = 0;i < M;i++){
        double x,y,z;
        int v,r;
        cin >> x >> y >> z >> v >> r;
        planets.push_back((planet){x,y,z,v,r});
    }
    cin >> N;
    for(int i = 0;i < N;i++){
        double x,y,z;
        cin >> x >> y >> z;
        gates.pb((gate){x,y,z});
    }
    cin >> D;
    int cnt = 0;
    for(int i = 0;i < (int)gates.size()-1;i++){
        for(int j = 0;j < M;j++){
            if(!vis[j] && within_range(gates[i],gates[i+1],planets[j])){
                vis[j] = true;
                cnt += planets[j].v;
            }
        }
    }
    cout << cnt << endl;
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC11S3 - Alice Through the Looking Glass](http://wcipeg.com/problem/ccc11s3)

This problem asks us to whether or not, given an ordered pair $$(x,y)$$ and a recursive depth level $$M$$, if the crystal at this location will be present; meaning it will not be cut off at any point due to the recursive method we generate the crystal. When we do generate this recursively we have to take into consideration the base cases. 

Base Cases
---

By inspection we notice that if $$(x,y)$$ lies in any part of the crystal the following inequalities must hold:
<center>$$5^{M-1} < x < 5^{M} \,\land\, 0 < y <= 3 \cdot 5^{M-1}$$</center>

Then we note that if $$(x,y)$$  lies in the left most part of the crystal then the following must hold :
<center>$$5^{M-1} < x < 5^{M} \,\land\, 0 < y <= 5^{M-1}$$</center>

if $$(x,y)$$  lies in the right most part of the crystal then the following must hold:
<center>$$3\cdot5^{M-1} <= x < 5^{M} \,\land\, 0 < y <= 5^{M-1}$$</center>

Recursive Case
---
If the current point does lie in the crystal then it must lie within coordinates:
<center>$$(x \mod 5^{M-1}, y \mod 5^{M-1})$$</center>

Time complexity: $$O(M)$$ 

{% highlight c++ linenos %}
#include<bits/stdc++.h>
using namespace std;

int m,n,x,y;

bool cryst(int m,int x,int y){
    if(m == 0){
        return false;
    }
    if(x > pow(5,m-1) && x < 5*pow(5,m-1) && y < 3*pow(5,m-1) ){
        //left
        if(x > pow(5,m-1)  && x <= 2*pow(5,m-1) && y <= pow(5,m-1)){
            return true;
        }
        //right
        if(x < 5*pow(5,m-1) && x >= 3*pow(5,m-1) && y <= pow(5,m-1)){
            return true;
        }
        //middle
        if(x > 2*pow(5,m-1) && x < 4*pow(5,m-1) && y <= 2*pow(5,m-1)){
            return true;
        }
        if(cryst(m-1,x%(int)pow(5,m-1),y%(int)pow(5,m-1))){
            return true;
        }
    }
    return false;
}

int main(){
    cin >> n;
    for(int i = 0;i < n;i++){
        cin >> m >> x >> y;
        if(cryst(m,x+1,y+1))
            cout << "crystal" << endl;
        else
            cout << "empty" << endl;
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC11S5 - Switch](http://wcipeg.com/problem/ccc11s5)

This problem asks us to find the minimum amount of light switches required to make a grid of size $$N$$, into a grid of turned off lights. Because the bounds on $$N$$ are relatively small we can represent each light as a bit in an integer using bitmasks. Now that we can easily represent our state all we must do is execute a breadth first search until we find a grid of turned of lights.  

Time Complexity: $$O(2^N)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
using namespace std;

int N,ID;
char C;
bool v[(1<<25)+1]; // maximum number of states we have to reach

int main(){
    scanf("%d",&N);
    for(int i = 0;i < N;i++){
        scanf(" %c",&C);
        if(C == '1')
           ID |= 1<<(i);
    }
    queue< pair<int,int> >q;
    q.push(mp(0,ID));
    while(!q.empty()){
        int d = q.front().x;
        int id = q.front().y;
        q.pop();
        for(int i = 0;i < N;i++){
            if(i+3 < N){
                /*Checks for 4 consecutive ones.*/
                if((id >> (i) & 1) 
                && (id >> (i+1) & 1) 
                && (id >> (i+2) & 1)
                && (id >> (i+3) & 1) ){
                     for(int j = i;j < N;j++){
                         if( (id >> (j) & 1) )
                            id ^= 1<<(j);
                         else
                            break;
                     }
                }
            }
        }
        if(id == 0){
            printf("%d\n",d);
            return 0;
        }
        for(int i = 0,bit = 0;i < N;i++){
            bit = (id>>i)&1;
            if(bit == 0 ){
                id ^= 1<<(i);
                if(!v[id]){
                    v[id] = true;
                    q.push(mp(d+1,id));
                }
                id ^= 1<<(i);
            }
        }
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC11S2P2 - Vampire Tunnels](http://wcipeg.com/problem/ccc11s2p2)

We are given a weighted graph and our asked to find the minimum amount of time required to reach a node N. This problem requires the use of Dijkstras algorithm with a small change to the algorithm. Since we are given another restriction on the edge weights we add another dimension to our distance array so are distance array is now, and now we just run Dijkstras on this graph.

Time Complexity: $$O(N \cdot S \cdot \log(N \cdot S))$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x) (x).begin(),(x).end()
#define x first
#define y second
#define UG 0
#define OG 1
using namespace std;


const int MAXN = 1601, MAXSL = 3601,INF = 0x3F3F3F3F;
int S,N,E,ans = INF,tans;
vector< pair<int,pair<int,int> > > adj[MAXN]; // city, distance, sunlight
int dist[MAXN][MAXSL];


void dijkstra(){
    priority_queue< pair<int,pair<int,int> > >pq;
    pq.push(mp(0,mp(0,0)));
    while(!pq.empty()){
        int d  =  -(pq.top().x);
        int sl =  -(pq.top().y.x);
        int n  =    pq.top().y.y;
        pq.pop();
        for(int i = 0;i < (int)adj[n].size();++i){
            int nt = adj[n][i].x;
            int w  = adj[n][i].y.x;
            int type = adj[n][i].y.y;
            if(type == UG){
                if(dist[nt][sl] > d+w){
                    dist[nt][sl] = d+w;
                    pq.push(mp(-dist[nt][sl],mp(-sl,nt)));
                }
            }
            else if(type == OG){
                if(sl + w <= S){
                    if(dist[nt][sl] > d+w){
                        dist[nt][sl] = d+w;
                        pq.push(mp(-dist[nt][sl],mp(-(sl+w),nt)));
                    }
                }
            }
        }
    }
}
int main(){
    memset(dist,INF,sizeof(dist));
    scanf("%d%d%d",&S,&N,&E);N--,E--;
    for(int i = 0,s,t,d,u; i <= E;++i){
        scanf("%d%d%d%d",&s,&t,&d,&u);
        adj[s].pb(mp(t,mp(d,u)));
        adj[t].pb(mp(s,mp(d,u)));
    }
    dijkstra();
    for(int i = 0; i <= S;++i)
        ans = min(ans,dist[N][i]);
    if(ans == INF)
        ans = -1;
    printf("%d\n",ans);
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC11S2P3 - Reorganization](http://wcipeg.com/problem/ccc11s2p3)

We are given a list of people and are asked whether or not it is possible to match an employee with a high rank with 0-2 employees with lower ranks. This can be accomplished by greedily matching an employee with an employee closest in rank, but which is still higher than its own rank. When there are no possible employees to match with then we simply print out “No”. Otherwise if the process is able to finish we print “Yes”.

Time Complexity: $$O(N \cdot \log(N))$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x) (x).begin(),(x).end()
#define x first
#define y second
#define nullptr 0
using namespace std;


int N;
set<int>v;
map<int,int>C;

int main(){
    cin >> N;
    for(int i = 0,j = 0;i < N;i++){
       cin >> j;
       if(i == 0)
          v.insert(j);
       else{
          set<int>::iterator it = --v.upper_bound(j);
          if(*v.begin() > j){
             printf("NO\n");
             return 0;
          }
          while(it != v.end()){
            if(C[*it] < 2){
               C[*it]++;
               v.insert(j);
               if(C[*it] == 2)
                  v.erase(it);
               break;
            }
            --it;
          }
          if(!v.count(j)){
             printf("NO\n");
             return 0;
          }
       }
    }
    printf("YES\n");
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC11S2P3 - Spies Like Us](http://wcipeg.com/problem/ccc11s2p3)

We are given a list of N people who wish to speak with each other, we then want to find whether a person shares more than one common contact with another person. This can be done by brute forcing the through all of the contact lists M and keeping track of how many common contacts people share.

Time Complexity: $$O(N^2 \cdot M)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x) (x).begin(),(x).end()
#define x first
#define y second
using namespace std;

const int MAXN = 2000;
int N,M,K;
int  cnt[MAXN][MAXN];
bool mtx[MAXN][MAXN];
vector<int>adj[MAXN];

int main(){
    scanf("%d%d%d",&N,&M,&K);
    for(int i = 0,a,b;i < K;i++){
        scanf("%d%d",&a,&b);
        adj[--a].pb(--b);
        mtx[a][b] = true;
    }
    for(int i = 0;i < N;i++){
        for(int j = 0;j < (int)adj[i].size();j++){
            for(int k = 0;k < N;k++){
                if(i!=k && mtx[k][adj[i][j]]){
                   cnt[i][k]++;
                   if(cnt[i][k] > 1){
                      printf("NO\n");
                      return 0;
                   }
                }
            }
        }
    }
    printf("YES\n");
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC12S4 - A Coin Game](http://wcipeg.com/problem/ccc12s4)

This problem asks us to keep track of a game and finding the minimum amount of moves required to make a certain grid into ascending order. This problem can be done by executing a breadth first search and using a set to represent the current game. From then one we keep on creating a grid until we reach our desired grid.


Time Complexity: 

If we assume without loss of generality that we can place numbers on top of each other, without the restrictions, 
then we can reduce the sample space we are searching to the number of combinations in the <a href="https://cp-algorithms.com/combinatorics/stars_and_bars.html">stars and bars</a> problem. From this we can see that a nice upper bound can be $$O((n+k-1)C(n))$$ where k = n meaning we have $$O((2n-1)C(n))$$ which is roughly O((2n) C (n) ), and using <a href="https://stackoverflow.com/questions/39558086/how-to-prove-binomial-coefficient-is-asymptotic-big-theta-of-two-to-the-power-n">stirlings approximation</a> we see that this is $$O(2^n)$$


{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define MAXN 8
#define reset_game(G,M) for(int i = 0; i < N;i++)G[i].clear();
using namespace std;

struct state{
    vector<int>g[MAXN];
    int d;
    string id;
};

int N,ai;
vector<int>game[MAXN];
set< string >past_game;


string to_s(int x){
    stringstream ss;
    string ret;
    ss << x;
    ss >> ret;
    return ret;
}

string to_id(vector<int>g[MAXN]){
    string id;
    for(int i = 0; i < MAXN;i++){
        string t;
        for(int j = 0; j < (int)g[i].size();j++){
            t+= to_s(g[i][j]);
        }
        t+="-";
        id+=t;
    }
    return id;
}
bool game_done(vector<int>g[MAXN]){
    for(int i = 0; i < N;i++)
        if(g[i].empty())
            return false;
    for(int i = 0; i < N;i++)
        if(g[i].size()!= 1 || g[i][0] != i+1)
            return false;
    return true;
}
void print_game(vector<int>g[MAXN],int d,string id){
    printf("D:%d ;",d);cout << id << endl;
    for(int i = 0; i < MAXN;i++){
        printf("%d:",i+1);
        for(int j = 0; j < (int)g[i].size();j++)
            printf("%d",g[i][j]);
        printf("\n");
    }
    printf("\n");
}
int bfs(){
    queue<state> q;
    q.push( (state){game[0],game[1],game[2],
                    game[3],game[4],game[5],
                    game[6],game[7],0,
                    to_id(game)});
    while(!q.empty()){
        vector<int>g[MAXN] = q.front().g;
        int d = q.front().d;
        string id = q.front().id;
        q.pop();
        if(past_game.find(id) != past_game.end())
            continue;
        else
            past_game.insert(id);
        //print_game(g,d,id);
        if(game_done(g)){
            return d;
        }
        for(int i = 0; i < N;i++){
            if(g[i].empty())
                continue;
            if(i-1>=0){
                int left_end = g[i-1].size()-1;
                int curr_end = g[i].size()-1;
                if(g[i-1].empty()){
                    g[i-1].push_back(g[i][curr_end]);
                    g[i].erase(g[i].begin() + curr_end);
                    q.push( (state){g[0],g[1],g[2],
                                    g[3],g[4],g[5],
                                    g[6],g[7],d+1,
                                    to_id(g)});
                    left_end++;curr_end--;
                    g[i].push_back(g[i-1][left_end]);
                    g[i-1].erase(g[i-1].begin()+left_end);
                }
                else if(g[i-1][left_end] > g[i][curr_end]){
                    g[i-1].push_back(g[i][curr_end]);
                    g[i].erase(g[i].begin() + curr_end);
                    q.push( (state){g[0],g[1],g[2],
                                    g[3],g[4],g[5],
                                    g[6],g[7],d+1,
                                    to_id(g)});
                    left_end++;curr_end--;
                    g[i].push_back(g[i-1][left_end]);
                    g[i-1].erase(g[i-1].begin()+left_end);
                }
            }
            if(i+1<N){
                int rght_end = g[i+1].size()-1;
                int curr_end = g[i].size()-1;
                if(g[i+1].empty()){
                    g[i+1].push_back(g[i][curr_end]);
                    g[i].erase(g[i].begin() + curr_end);
                    q.push( (state){g[0],g[1],g[2],
                                    g[3],g[4],g[5],
                                    g[6],g[7],d+1,
                                    to_id(g)});
                    rght_end++;curr_end--;
                    g[i].push_back(g[i+1][rght_end]);
                    g[i+1].erase(g[i+1].begin()+rght_end);
                }
                else if(g[i+1][rght_end] > g[i][curr_end]){
                    g[i+1].push_back(g[i][curr_end]);
                    g[i].erase(g[i].begin() + curr_end);
                    q.push( (state){g[0],g[1],g[2],
                                    g[3],g[4],g[5],
                                    g[6],g[7],d+1,
                                    to_id(g)});
                    rght_end++;curr_end--;
                    g[i].push_back(g[i+1][rght_end]);
                    g[i+1].erase(g[i+1].begin()+rght_end);
                }
            }
        }
    }
    return -1;
}
int main(){
    while(scanf("%d",&N)&& N!= 0){
        for(int i = 0; i < N;i++){
            scanf("%d",&ai);
            game[i].push_back(ai);
        }
        //print_game(game,0,to_id(game));
        int ans = bfs();
        if(ans == -1)printf("IMPOSSIBLE\n");
        else         printf("%d\n",ans);
        past_game.clear();
        reset_game(game,MAXN);
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC12S2P2 - The Hungary Games](http://wcipeg.com/problem/ccc12s2p2)

This problem asks us to find the second shortest path in a graph. This can be done using either Dijkstra’s algorithm or the shortest path faster algorithm, with a small change. This change being that instead of holding the minimum distance to a node, we keep the two smallest distances to a node.

Time Complexity: $$O(E+V)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x x
#define y y
using namespace std;

const int MAXN = 2*(int)1e4 + 5, INF = 0x3F3F3F3F;
int N,M,dist[MAXN][2];
vector< pair<int,int> > adj[MAXN];// city, weight

void spfa(){
    queue< pair<int,int> >q;
    q.push(mp(0,1));
    while(!q.empty()){
        int n = q.front().y;
        int d = q.front().x;
        q.pop();
        for(int i = 0; i < (int)adj[n].size();++i){
            if(dist[adj[n][i].x][0] > d + adj[n][i].y){
                dist[adj[n][i].x][1] = dist[adj[n][i].x][0];
                dist[adj[n][i].x][0] = d+adj[n][i].y;
                q.push(mp(d+adj[n][i].y,adj[n][i].x));
            }
            else if(dist[adj[n][i].x][0] != d + adj[n][i].y 
                    && dist[adj[n][i].x][1] > d + adj[n][i].y){
                dist[adj[n][i].x][1] = d+adj[n][i].y;
                q.push(mp(d+adj[n][i].y,adj[n][i].x));
            }
        }
    }
}

int main(){
    memset(dist,INF,sizeof(dist));
    scanf("%d%d",&N,&M);
    for(int i = 0,a,b,l; i < M;++i){
        scanf("%d%d%d",&a,&b,&l);
        adj[a].pb(mp(b,l));
    }
    spfa();
    printf("%d\n",(dist[N][1] != INF) ? dist[N][1]:-1);
    return 0;
}

{% endhighlight c++ %}

# Solution for [CCC12S2P3 - Mhocksian Languages](http://wcipeg.com/problem/ccc12s2p3)

This problem asks us if a given word can be created using a set of rules. This can be done by setting a dynamic programming state where each states represents a link between variable and a certain word. Once we have set our state we can use recursion and memorization to check if a word is possible. 

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define all(x) (x).begin(),(x).end()
#define db 0
using namespace std;

int V,T,R,W;
vector<string>var;
map<string,vector<string> >rules;
map<string,map<string,bool> >path;
string a,b,c;


bool possible(string word,string var){
     if(path[var].count(word))
        return path[var][word];
     else{
        for(int i = 1;i < (int)word.length();i++){
            string w1 = word.substr(0,i);
            string w2 = word.substr(i,-1);
            for(int j = 0;j < (int)rules[var].size();j++){
                string v1; v1 += rules[var][j][0];
                string v2; v2 += rules[var][j][1];
                if(possible(w1,v1) && possible(w2,v2)){
                   path[var][word] = true;
                   return true;
                }
            }
        }
         path[var][word] = false;
         return false;
     }
}

int main(){
  cin >> V >> T;
  for(int i = 0;i < V;++i){
    cin >> a;
    if(i == 0)// we only care about the first element
       var.pb(a);
  }
  for(int i = 0;i < T;++i){
    cin >> a;
    // we don't care about these
  }
  cin >> R;
  for(int i = 0;i < R;++i){
    cin >> a >> b;
    path[a][b] = true;
  }
  cin >> R;
  for(int i = 0;i < R;++i){
    cin >> a >> b >> c;
    rules[a].pb(b+c);
  }
  cin >> W;
  for(int i = 0;i < W;++i){
      cin >> a;
      if(possible(a,var[0]))
         cout << 1 << endl;
      else
         cout << 0 << endl;
  }
  return 0;
}
{% endhighlight c++ %}

# Solution for [CCC13S2P2 - Tourney](http://wcipeg.com/problem/ccc13s2p2)

This problem asks us to keep track of an ongoing competition and support three queries:


1)  Updating a person’s skill


2)  Finding the number of people a person win’s against


3)  Who won the competition


All of these queries can be solved using two segment trees, the first segment tree represents who won each round of the competition and the second segment tree represents the number of wins each individual had. 

Time Complexity: $$O(N + Q\log{N})$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
using namespace std;

const int MAXN = (1<<20)+5,inf = 0x3f3f3f3f;
int N,M,I,S,qlo,qhi,idx;
int arr[MAXN],best[4*MAXN],tree[4*MAXN];
char cmd;
map<int,int>score_to_index;

int query(int n,int lo,int hi){
    if(lo > hi || lo > qhi || hi < qlo)
       return -inf;
    else if(lo >= qlo && hi <= qhi)
       return tree[n];
    else
       return max(query(2*n,lo,(lo+hi)/2),query(2*n+1,(lo+hi)/2+1,hi));
}
int query2(int n,int lo,int hi){
    if(lo > hi || lo > qhi || hi < qlo)
       return 0;
    else if(tree[n] == arr[idx])
       return best[n];
    else
       return max(query2(2*n,lo,(lo+hi)/2) , query2(2*n+1,(lo+hi)/2+1,hi));
}
void update(int n,int lo,int hi){
    if(idx >= lo && idx <= hi){
       if(lo == hi)
          tree[n] = arr[lo];
       else{
          update(2*n,lo,(lo+hi)/2);
          update(2*n+1,(lo+hi)/2+1,hi);
          tree[n] = max(tree[2*n],tree[2*n+1]);
          best[n] = max(best[2*n],best[2*n+1]) + 1;
       }
    }
}

int main(){
    memset(tree,-inf,sizeof(tree));
    scanf("%d%d",&N,&M);N = (1<<N);
    for(int i = 1;i <= N;++i){
        scanf("%d",&arr[i]);
        idx = i;
        score_to_index[arr[i]] = i;
        update(1,1,N);
    }
    for(int i = 1;i <= M;++i){
        scanf(" %c",&cmd);
        if(cmd == 'R'){
          scanf("%d%d",&I,&S);
          score_to_index[S] = I;
          arr[I] = S;
          qlo = qhi = idx = I;
          update(1,1,N);
        }
        if(cmd == 'W'){
          qlo = 1,qhi = N;
          printf("%d\n",score_to_index[query(1,1,N)]);
        }
        if(cmd == 'S'){
          scanf("%d",&I);
          idx = qlo = qhi = I;
          printf("%d\n",query2(1,1,N));
        }
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC13S2P3 - LHC](http://wcipeg.com/problem/ccc13s2p3)

This problem asks us to find the diameter of a tree and to find how many times this diameter appears in the tree.  We can find the diameter of the tree by using two breadth first searches. The key observation to make is that for every diameter in the tree it must always pass through one common node. This node be can found using by traversing  $$diamater/2$$ nodes back from the last node in a diameter. Once this central node is found we can divide the problem into two cases: 


1)  The diameter of the tree is odd


2)  The diameter of the tree is even

In the case where the diameter of the tree is odd we can prove that all of sub-trees of importance from this central node must be even in height. This is because since the diameter is odd is consists of one node (the central node) and two even branches of equal height. Through this observation we can then   determine the amount of diameters that can be made by checking each sub-tree from the central node and doing some arithmetic and reasoning.
In the case where the diameter of the tree is odd we can prove that there will always be one branch from the central node that is the longest. Then we know we just have to multiply the occurrences of this one branch to the occurrences of the next biggest branch from the central node.


Time Complexity: $$O(E + V)$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 0
#define all(x)(x).begin(),(x).end()
#define x first
#define y second
#define LL long long
using namespace std;

const int MAXN = 400000;
int N;
int tree[MAXN][2];
int parent[MAXN];
bool v[MAXN];
vector<int>adj[MAXN];


void reset(){
    for(int i = 0;i < MAXN;i++){
        parent[i] = i;
        v[i] = false;
    }
}
pair<int,int> bfs(int u){
    queue< pair<int,int> >q;
    pair<int,int>fn = mp(0,0);
    q.push(mp(u,1));
    reset();
    v[u] = true;
    while(!q.empty()){
       int n = q.front().x;
       int d = q.front().y;
       q.pop();
       if(d > fn.y)
          fn.x = n,fn.y = d;
       for(int i = 0;i < (int)adj[n].size();i++){
          if(!v[adj[n][i]]){
             parent[adj[n][i]] = n;
             v[adj[n][i]]      = true;
             q.push(mp(adj[n][i],d+1));
           }
       }
    }
    return fn;
}
void dfs(int n){
      tree[n][0] = 1;
      tree[n][1] = 0;
      v[n] = true;
      for(int i = 0;i < (int)adj[n].size();i++){
          if(!v[adj[n][i]]){
            dfs(adj[n][i]);
            if(tree[adj[n][i]][1]  > tree[n][1]){
               tree[n][0] = tree[adj[n][i]][0];
               tree[n][1] = tree[adj[n][i]][1];
            }
            else if(tree[adj[n][i]][1] == tree[n][1])
               tree[n][0] += tree[adj[n][i]][0];
         }
      }
      tree[n][1] += 1;
}

int main(){
    scanf("%d",&N);N--;
    int sn = 0;
    for(int i = 0,a,b;i < N;i++){
        scanf("%d%d",&a,&b);
        adj[--a].pb(--b);
        adj[b].pb(a);
        if(i == 0)sn = a;
    }
    // bfs from one node
    pair<int,int> ln1 = bfs(sn);
    // bfs from farthest node
    pair<int,int> ln2 = bfs(ln1.x);
    if(ln2.y%2 != 0){// the diameter of the tree is odd
       LL longest_path = ln2.y, occurences = 0;
       int back_track = ln2.y/2;
       while(back_track--){// backtrack to the central node
           ln2.x = parent[ln2.x];
       }
       // now dfs from the central node
       reset();
       dfs(ln2.x);
       LL best[2];
       best[0] = tree[ln2.x][0];
       best[1] = tree[ln2.x][1]-1;
       for(int i = 0;i < (int)adj[ln2.x].size();i++){
           if(tree[ adj[ln2.x][i] ][1] == best[1]){
              occurences+= tree[adj[ln2.x][i]][0]*(best[0]-tree[adj[ln2.x][i]][0]);
              best[0]-=tree[adj[ln2.x][i]][0];
           }
       }
       printf("%lld %lld\n",longest_path,occurences);

    }else{// the diamater of the tree is even
       LL longest_path = ln2.y, occurences = 0;
       int back_track = ln2.y/2;
       while(back_track--){// backtrack to the central node
           ln2.x = parent[ln2.x];
       }
       reset();
       dfs(ln2.x);// find the subtrees
       LL best[2][2]= { {0,0},{0,0}};
       for(int i = 0;i < (int)adj[ln2.x].size();i++){
           if(tree[adj[ln2.x][i]][1] > best[0][1]){ // there is only one subtree of maximal length
              best[0][1] = tree[adj[ln2.x][i]][1];
              best[0][0] = tree[adj[ln2.x][i]][0];
           }
           else if(tree[adj[ln2.x][i]][1] > best[1][1]){// there are other trees of smaller length
              best[1][1] = tree[adj[ln2.x][i]][1];
              best[1][0] = tree[adj[ln2.x][i]][0];
           }
           else if(tree[adj[ln2.x][i]][1] == best[1][1])// we add up the trees of the same length
              best[1][0] += tree[adj[ln2.x][i]][0];
       }
       occurences = best[0][0]*best[1][0];
       printf("%lld %lld\n",longest_path,occurences);
    }
    return 0;
}
{% endhighlight c++ %}

# Solution for [CCC14S4 - Tinted Glass Windows](http://wcipeg.com/problem/ccc14s4)

This problem asks to find the area for the union of rectangles, if and only if the area in the union of rectangles is greater than or equal to a specified value T. This can be done using a line sweep algorithm. The main idea for the line sweep algorithm shown is that we create vertical line segments for beginning and ending of each rectangle. Once this is done we sort these segments and traverse them in order from lowest x coordinate to the highest. 


Time Complexity: $$O(N^{2} \log{N})$$

{% highlight c++ linenos %}
#include<bits/stdc++.h>
#define pb push_back
#define mp make_pair
#define db 1
#define lb(x) ((x)&(-x))
#define all(x) (x).begin(),(x).end()
#define needforspeed ios::sync_with_stdio(0);cin.tie(0)
#define endl '\n'
#define pb push_back
#define mp make_pair
#define LL long long
using namespace std;


struct line{
    int x,id;
    int y1,y2;
    int tint,type;
    line(int _x,int _y1,int _y2,int _tint,int _id, int _type){
        x = _x;
        y1 = _y1,y2 = _y2;
        id = _id,tint = _tint, type = _type;
    }
    bool operator < (const line&rht)const{
       return x == rht.x ? type < rht.type:x < rht.x;
    }
};
struct point{
   int y,id;
   int tint,type;
   point(int _y,int _id,int _tint,int _type){
         y = _y,id = _id;
         tint = _tint, type = _type;
   }
   bool operator < (const point&rht)const{
       return y == rht.y ? type < rht.type:y < rht.y;
    }
};


const int START = 1,END = -1;
int N,T;
LL ANS;
vector<line> segments;

int main(){
    needforspeed;
    cin >> N >> T;
    for(int i = 0,x1,y1,x2,y2,t,id = 0;i < N;i++){
        cin >> x1 >> y1 >> x2 >> y2 >> t;
        segments.pb( (line){x1,y1,y2,t,id,START});
        segments.pb( (line){x2,y1,y2,t,id,END});
        id++;
    }
    sort(all(segments));
    vector<point>y_axis;
    for(int i = 0;i < (int)segments.size();i++){
       if(i > 0){
          LL delta_x = abs(segments[i].x-segments[i-1].x);
          LL ctint = 0,delta_y = 0;
          for(int j = 0;j < (int)y_axis.size();j++){
              if(j > 0){
                delta_y = y_axis[j].y - y_axis[j-1].y;
                if(ctint >= T)
                   ANS += delta_x*delta_y;

                if(y_axis[j].type == START)
                   ctint += y_axis[j].tint;
                else
                   ctint -= y_axis[j].tint;
              }
              else
                 ctint+=y_axis[j].tint;

          }
          if(segments[i].type == START){
             y_axis.pb((point){segments[i].y1,segments[i].id,segments[i].tint,START});
             y_axis.pb((point){segments[i].y2,segments[i].id,segments[i].tint,END});
             sort(all(y_axis));
          }
          if(segments[i].type == END){
             for(int j = 0;j < (int)y_axis.size();j++){
                 if(segments[i].id == y_axis[j].id){
                    y_axis.erase(y_axis.begin()+j);
                    j--;
                 }
             }
          }
       }
       else{
         y_axis.pb((point){segments[i].y1,segments[i].id,segments[i].tint,START});
         y_axis.pb((point){segments[i].y2,segments[i].id,segments[i].tint,END});
         sort(all(y_axis));
       }
    }
    cout << ANS << endl;
    return 0;
}
{% endhighlight c++ %}

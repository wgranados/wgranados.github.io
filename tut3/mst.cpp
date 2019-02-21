#include<iostream>
#include<cstdio>
#include<cstring>
#include<algorithm>
#include<queue>
using namespace std;


const int MAXN = 100, INF = 0x3F3F3F3F;
int T,N,C;
int parent[MAXN];
bool visited[MAXN];
vector< pair<int,int> >adj[MAXN];
vector< pair<int, pair<int,int> > >edges;

int prim(){
    priority_queue< pair<int, pair<int,int> > >pq;    // (edge){weight,start node,end node}
    int MSTEdges = 0, totalWeight = 0;
     // note that in C++ the priority queue is by default a max heap,
    // so a good trick to make it a min heap is when inserting items
    // into the heap, we negate them, then when we retrieve items,
    // we negate it again
    for(int i = 0; i < adj[0].size();i++){// arbitarily choose first node to start prim's algorithm from, 0 is the first node;
        pq.push(make_pair(-adj[0][i].second, make_pair(0,adj[0][i].first)));// adjacency edge {end node,cost}
    }
    memset(visited,false,sizeof visited);// set all nodes to not visited
    visited[0] = true;// set first node to visisted
    while(MSTEdges < N-1 && !pq.empty()){// Minimum spanning trees have N-1 edges
        int w = -pq.top().first;
        int sn = pq.top().second.first;
        int en = pq.top().second.second;
        pq.pop();
        if(!visited[en]){
            visited[en] = true;
            MSTEdges++;
            totalWeight+=w;
            for(int i = 0; i < adj[en].size();i++)
                pq.push(make_pair(-adj[en][i].second, make_pair(en,adj[en][i].first)));// adjacency edge {end node,cost}
        }
    }
    return (MSTEdges == N-1) ? totalWeight:-1;// if we have less than N-1 edges then that means the graph is disconnected
}


/** Union find operations for disjoint set datastructure using path compression
 *  and union by rank in O(ackerman(n)) time.
 * */
int find(int x){
    if(parent[x]!=x)parent[x]=find(parent[x]);
    return parent[x];
}
bool merge(int x, int y){
    x = find(x);
    y = find(y);
    if(x == y)
        return false;
    else if(parent[x] < parent[y])
        parent[y] = x;
    else
        parent[x] = y;
    return true;
}

int kruskal() {
    // set the representative of each individual set to itself
    for(int i = 0; i < N;i++) {
        parent[i] = i;
    }
    sort(edges.begin(),edges.end()); // sort the edges by least weight
    int MSTEdges = 0, totalWeight= 0;
    for(int i = 0; i < edges.size() && MSTEdges< N-1 ;i++){
        int a = find(edges[i].second.first);
        int b = find(edges[i].second.second);
        if(a!=b){
            merge(edges[i].second.first,edges[i].second.second);
            totalWeight+=edges[i].first;
            MSTEdges++;
        }
    }
    return (MSTEdges == N-1) ? totalWeight:-1;// if we have less than N-1 edges then that means the graph is disconnected
}

int main(){
    //freopen("input.txt","r",stdin);
    scanf("%d",&T);
    while(T--){
        scanf("%d%d",&N,&C);
        for(int c = 0,i,j,k;c < C;c++){
            scanf("%d%d%d",&i,&j,&k);i--,j--;
            adj[i].push_back(make_pair(j,k));
            adj[j].push_back(make_pair(i,k));
            edges.push_back(make_pair(k, make_pair(i,j)));
        }
        int ans = prim();
        if(ans != -1) {
            printf("%d\n",ans);
        }
        else {
            printf("Requires more conduits\n");
        }
        // remove items for next testcase
        edges.clear();
        for(int i = 0; i < MAXN;i++) {
            adj[i].clear();
        }
    }
    return 0;
}

#include <stdio.h>
#include <vector>
#include <queue>
using namespace std;


vector< pair<int,int> >adj[1000];
vector< int > dist(1000, 25000000);
int N,E;

int dijkstra(){
	queue< pair<int,int> > q;
	q.push( make_pair(0,0));
	while(!q.empty()){
		int d = q.front().first;
		int n = q.front().second;
		q.pop();
		for(int i = 0;i < adj[n].size();i++){
		   if(dist[adj[n][i].first] > d + adj[n][i].second){
		        dist[adj[n][i].first] = d + adj[n][i].second;
                q.push( make_pair( dist[adj[n][i].first],adj[n][i].first ));
		    }
		}
	}
	return -1;
}
int main() {
   // freopen("input.txt","r",stdin);
	scanf("%d%d",&N,&E);
	int a,b,c;
	for(int i = 0;i < E;i++){
		scanf("%d%d%d",&a,&b,&c);
		adj[a-1].push_back( make_pair(b-1,c));
	}
	dijkstra();
	printf("%d\n",dist[N-1]);
	//fclose(stdin);
	return 0;
}

function getSolution() {
    console.log("you have been gnomed!")
    // var vid = document.createElement("iframe");
    // vid.setAttribute("src", "https://www.youtube.com/embed/6n3pFFPSlW4?autoplay=1");
    // vid.setAttribute("width", "560");
    // vid.setAttribute("height", "315");
    // vid.setAttribute("frameborder", "0");
    // vid.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
    var crunchy = document.createElment("img");
    crunchy.src ="https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwjY3ZWY0LXjAhWkmOAKHZNMCb0QjRx6BAgBEAU&url=https%3A%2F%2Fwww.sante.com.pl%2Fproducts%2Fcrunchy-bar-nuts-almonds-35g%2F&psig=AOvVaw0K2_urxW4y5DA7ntFu3TE7&ust=1563235499212202"
    const sln = document.getElementById("sln");
    const par = sln.parentNode;
    par.replaceChild(cruncy, sln);
}

function populate(){
    const grid = [ 
        ["", "", "", "9", "", "2", "", "", ""], 
        ["", "4", "", "", "", "", "", "5", ""],
        ["", "", "2", "", "", "", "3", "", ""], 

        ["2", "", "", "", "", "", "", "", "7"],
        ["", "", "", "4", "5", "6", "", "", ""], 
        ["6", "", "", "", "", "", "", "", "9"],

        ["", "", "7", "", "", "", "8", "", ""], 
        ["", "3", "", "", "", "", "", "4", ""],
        ["", "", "", "2", "", "7", "", "", ""], 
    ];
    const rows =  ["row1", "row2", "row3", "row4", "row5", "row6", "row7", "row8", "row9"];
    for (row in rows) {
        const index = rows[row];
        const children = document.getElementById(index).childNodes;
        for (child in children) {
            if (children.hasOwnProperty(child)) {
                const vnode = children[child];
                if(vnode.nodeName === 'INPUT') {
                    const i = parseInt(row); 
                    const j = vnode.id -1;
                    const val = grid[i][j];
                    vnode.setAttribute('value', val);
                }
            }
        }
    }

}


function hidemonty() {
    var x = document.getElementById("monty");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

function hidebirthday() {
    var x = document.getElementById("birthday");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

function hideball() {
    var x = document.getElementById("ball");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

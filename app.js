
// including necessary npm packages

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");


// connecting to the MongoDB database named 'todolistDB'.
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});


// setting up the express framework for nodeJS
const app = express();

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.set("view engine", "ejs");


// Database Schemas

const listSchema = {
    task: String
};

const pageSchema = {
    name: String,
    items: [listSchema]
}

// Database collections

const Item = mongoose.model("Item", listSchema);

const Page = mongoose.model("Page", pageSchema);



let currentPage = "Home";



// creating default tasks for ToDo list.

const item1 = new Item ({
    task: "Welcome to your ToDo List"
});

const item2 = new Item ({
    task: "Click + to add new item"
});

const item3 = new Item ({
    task: "Click checkbox to delete item"
});

const defaultList = [item1, item2, item3];


// Main route setup

app.get("/", function(req, res) {
    
    Item.find({}, function(err, foundItem) {

        if(foundItem.length == 0) {
            Item.insertMany(defaultList, function(err) {
                if(err){
                    console.log(err);
                } else {
                    console.log("Successfully added data...");
                }
            })

            res.redirect("/");
        }
        else {
            res.render("list", {items: foundItem, page:currentPage});
        }
    })
    
})


// custome page setup for multiple lists

app.get("/:pageName", function(req, res) {
    const pageName = _.capitalize(req.params.pageName);

    // From Page collection model, it will find an object which has the name 'pageName',
    // and return the object as 'foundPage'.

    Page.findOne({name: pageName}, function(err, foundPage) {
        if (!err) {
            
            if (!foundPage) {           // if foundPage does not exist, then
                
                const pageData = Page({
                    name: pageName,
                    items: defaultList
                });
            
                pageData.save(()=> {res.redirect("/" + pageName)})
                
            }
            
            else {                      // if foundPage exist, then
                
                res.render("list", {page: foundPage.name, items: foundPage.items});
            }
        }
    })

});


// adding new items to the list.

app.post("/", function(req,res) {
    
    const newItem = req.body.newItem;       // hold the task we wrote
    const pageList = req.body.pageList;     // custom or home page name
    
    const item = new Item({                 // new item which gonna be added to the respective list
        task: newItem
    });


    // checking for which page or list will have the new item. 

    if(pageList == "Home") {
        item.save();
        res.redirect("/");
    }
    else {
        Page.findOne({name: pageList}, function(err, foundPage) {
            foundPage.items.push(item);
            foundPage.save(()=> {res.redirect("/" + pageList);});
        });
        
    }

});


// deleting the tasks from the list

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;

    const pageName = req.body.hiddenInput;
    
    if (pageName === "Home") {
        // from 'Item' colletion model, it will find the object with 'checkedItemId' ID, and delete.
        
        Item.findByIdAndDelete(checkedItemId, function(err) {
            if(err) console.log(err);
        });
        res.redirect("/");
    }
    else {
        // From Page collection model, it will find an object which has the name 'pageName',
        // then $pull is used for deleting with specific projection,
        // it is projectied to items array of objects,
        // so which ever object have the 'checkedItemId' ID, will get deleted. 

        Page.findOneAndUpdate({name: pageName}, {$pull: { items: {_id : checkedItemId}}}, function(err) {
            if(err) console.log(err);
        });
        res.redirect("/" + pageName);
    }

});


// page name collecting and redirecting to the custome page route.
app.post("/page", function(req, res) {

    res.redirect("/" + req.body.pageName);

});


const port = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.log('Server is running on port ' + port);
});
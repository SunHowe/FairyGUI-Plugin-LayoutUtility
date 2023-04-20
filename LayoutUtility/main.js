"use strict";

const csharp_1 = require("csharp");
const puerts_1 = require("puerts");
const { __esModule } = require("../CustomAttributer");
const App = csharp_1.FairyEditor.App;
const FRelationType = csharp_1.FairyEditor.FRelationType;

let appToolMenu = App.menu.GetSubMenu("tool");
let docMenu = App.docFactory.contextMenu;
let libMenu = App.libView.contextMenu;

let tools = [];

let KEY_NAME = "name";
let KEY_IDENTIFY = "identify";
let KEY_FUNC = "func";
let KEY_CONTEXT = "context";

let INSPECTOR_NAME_BASIC = "basic";
let INSPECTOR_NAME_RELATION = "relation";

let BRANCH_NAME_TRUNK = "";
let BRANCH_NAME_AR = "l10n_ar";

let addTool = function (name, identify, context, func) {
    let tool = {};
    tool[KEY_NAME] = name;
    tool[KEY_IDENTIFY] = identify;
    tool[KEY_FUNC] = func;
    tool[KEY_CONTEXT] = context;
    tools.push(tool);
};

// 位置水平翻转
let flipHorizontal = function (obj, width) {
    let item_x = obj.x;
    let item_width = obj.width;
    let anchor_offset_x = 0;
    if (obj.anchor) {
        anchor_offset_x = item_width * obj.pivotX;
    }

    obj.x = width - (item_x - anchor_offset_x) - item_width + anchor_offset_x;
}

// 关联水平翻转
let filpHorizontalRelationDef = function (relationItemDef) {
    switch (relationItemDef.type) {
        case FRelationType.Left_Left:
            relationItemDef.type = FRelationType.Right_Right;
            break;
        case FRelationType.Left_Center:
            relationItemDef.type = FRelationType.Right_Center;
            break;
        case FRelationType.Left_Right:
            relationItemDef.type = FRelationType.Right_Left;
            break;
        case FRelationType.Right_Left:
            relationItemDef.type = FRelationType.Left_Right;
            break;
        case FRelationType.Right_Center:
            relationItemDef.type = FRelationType.Left_Center;
            break;
        case FRelationType.Right_Right:
            relationItemDef.type = FRelationType.Left_Left;
            break;
        case FRelationType.LeftExt_Left:
            relationItemDef.type = FRelationType.RightExt_Right;
            break;
        case FRelationType.LeftExt_Right:
            relationItemDef.type = FRelationType.RightExt_Left;
            break;
        case FRelationType.RightExt_Left:
            relationItemDef.type = FRelationType.LeftExt_Right;
            break;
        case FRelationType.RightExt_Right:
            relationItemDef.type = FRelationType.LeftExt_Left;
            break;
        default:
            break;
    }
}

// 关联水平翻转
let flipHorizontalRelation = function (obj) {
    let count = obj.relations.items.Count;
    for (let i = 0; i < count; i++) {
        let relationItem = obj.relations.items.get_Item(i);
        let defsCount = relationItem.defs.Count;
        for (let j = 0; j < defsCount; j++) {
            let relationItemDef = relationItem.defs.get_Item(j);
            filpHorizontalRelationDef(relationItemDef);
        }
    }
}

// 水平对齐模式翻转
let flipHorizontalAlignment = function (obj) {
    switch (obj.align) {
        case "left":
            obj.align = "right";
            break;
        case "right":
            obj.align = "left";
            break;
    }
}

let getCachedRelations = function (obj) {
    let relations = []
    let count = obj.relations.items.Count;
    for (let i = 0; i < count; i++) {
        let relationItem = obj.relations.items.get_Item(i);
        let defsCount = relationItem.defs.Count;

        // {
        //    target: obj,
        //    defs: [{ "percent": true, type: 1 }]
        // }
        let relation = {}
        relation.target = relationItem.target;
        relation.defs = []

        for (let j = 0; j < defsCount; j++) {
            let relationItemDef = relationItem.defs.get_Item(j);
            let def = {};
            def.percent = relationItemDef.percent;
            def.type = relationItemDef.type;
            relation.defs.push(def);
        }

        relations.push(relation);
    }

    return relations;
}

let restoreRelations = function (obj, relations) {
    for (let i = 0; i < relations.length; i++) {
        let relation = relations[i];
        for (let j = 0; j < relation.defs.length; j++) {
            let def = relation.defs[j];
            obj.relations.AddItem(relation.target, def.type, def.percent);
        }
    }
}

let removeRelations = function (obj) {
    while (obj.relations.items.Count > 0) {
        let item = obj.relations.items.get_Item(0);
        obj.relations.RemoveTarget(item.target);
    }
}

// 关联水平翻转+位置翻转
let flipHorizontalRelationAndPosition = function (nodes, width) {

    let cachedRelations = [];
    for (let i = 0; i < nodes.Count; i++) {
        let node = nodes.get_Item(i);
        let cacheRelation = getCachedRelations(node);
        cachedRelations.push(cacheRelation);
        removeRelations(node);
    }

    for (let i = 0; i < nodes.Count; i++) {
        let node = nodes.get_Item(i);
        if (node.objectType == "group") {
            if (isHorizontalGroup(node)) {
                flipHorizontalGroup(node);
                flipHorizontal(node, width);
            }
            continue;
        }

        if (node._group != null && isHorizontalGroup(node._group)) {
            // 处于水平布局分组内 忽略处理
            continue;
        }

        flipHorizontal(node, width);
    }

    for (let i = 0; i < nodes.Count; i++) {
        let node = nodes.get_Item(i);
        let cacheRelation = cachedRelations[i];

        restoreRelations(node, cacheRelation);
        flipHorizontalRelation(node);
    }
}

// 是否是水平布局组
let isHorizontalGroup = function (group) {
    if (group.objectType != "group")
        return false;

    if (!group.advanced)
        return false;

    if (group.layout != csharp_1.FairyEditor.FGroup.HORIZONTAL)
        return false;

    return true;
}

// 水平布局组翻转
let flipHorizontalGroup = function (group) {
    if (!isHorizontalGroup(group))
        return;

    let objects = [];

    for (let i = 0; i < group.children.Count; i++) {
        objects.push(group.children.get_Item(i));
    }

    for (let i = 0; i < objects.length; i++) {
        let j = objects.length - i - 1;
        if (j <= i)
            break;

        let childA = objects[i];
        let childB = objects[j];

        childA.parent.SwapChildren(childA, childB);
    }

    group.UpdateImmdediately();
}

// 创建阿语分支文件夹
let createARBranchDirectory = function (packageObj) {
    let branchRoot = packageObj.GetBranchRootItem(BRANCH_NAME_AR);
    if (branchRoot == null) {
        packageObj.CreateBranch(BRANCH_NAME_AR);
        branchRoot = packageObj.GetBranchRootItem(BRANCH_NAME_AR);
        console.log("Create branch:" + BRANCH_NAME_AR);
    }
}

// 拷贝组件到分支路径
let copyComponentToARBranch = function (packageItem) {
    let packageObj = packageItem.owner;
    let path = "/:" + BRANCH_NAME_AR + packageItem.path;

    let item = packageObj.GetItemByPath(path);
    if (item == null) {
        packageObj.CreatePath(path);
    }

    let newItem = packageObj.DuplicateItem(packageItem, packageItem.name + "_Temp");

    packageObj.MoveItem(newItem, path);
    packageObj.RenameItem(newItem, packageItem.name);
    return newItem;
}

// 对组件进行阿语转置
let executeARTranslate = function (packageItem) {
    let url = packageItem.GetURL();
    console.log("进行阿语转置: " + packageItem.name + ", url:" + url);

    let closeAfterExecute = false;
    let doc = App.docView.FindDocument(url);
    if (doc == null) {
        doc = App.docView.OpenDocument(url, true);
        closeAfterExecute = true;
    }

    let nodes = doc.content.children;
    let width = doc.packageItem.width;

    flipHorizontalRelationAndPosition(nodes, width);

    for (let i = 0; i < nodes.Count; i++) {
        let node = nodes.get_Item(i);
        switch (node.objectType) {
            case "list":
            case "loader":
            case "text":
            case "richtext":
            case "inputtext":
                flipHorizontalAlignment(node);
                break
        }
    }

    doc.SetModified(true);
    App.docView.SaveDocument(doc);

    if (!closeAfterExecute)
        return;

    App.docView.CloseDocument(doc);
}

let createARBranchComponents = function (packageObj, packageItems, needTranslate) {
    // 步骤1. 创建阿语分支文件夹
    createARBranchDirectory(packageObj);

    let items = []
    let itemNames = []
    for (let i = 0; i < packageItems.length; i++) {
        let item = packageItems[i];
        if (item.type != "component")
            continue;

        if (item.branch != "" && item.branch != null)
            continue;

        items.push(item);
        itemNames.push(item.name);
    }

    // 步骤2. 拷贝组件到阿语文件夹下
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let newItem = copyComponentToARBranch(item);

        if (!needTranslate)
            continue;

        // 转置
        executeARTranslate(newItem);
    }
}

addTool("位置水平翻转", "HorizontalPosFlip", docMenu, function (params) {
    let doc = App.activeDoc;
    if (doc == null) {
        return;
    }

    let selections = doc.GetSelection();
    if (selections.Count == 0) {
        return;
    }

    let width = doc.packageItem.width;

    for (let i = 0; i < selections.Count; i++) {
        let selection = selections.get_Item(i);
        flipHorizontal(selection, width);
    }

    doc.SetModified(true);

    App.inspectorView.Refresh(INSPECTOR_NAME_BASIC);
});

addTool("水平关联翻转", "HorizontalRelationFlip", docMenu, function (params) {
    let doc = App.activeDoc;
    if (doc == null) {
        return;
    }

    let selections = doc.GetSelection();
    if (selections.Count == 0) {
        return;
    }

    for (let i = 0; i < selections.Count; i++) {
        let selection = selections.get_Item(i);
        flipHorizontalRelation(selection);
    }

    doc.SetModified(true);

    App.inspectorView.Refresh(INSPECTOR_NAME_RELATION);
});

addTool("位置水平翻转&关联翻转", "HorizontalPosRelationFlip", docMenu, function (params) {
    let doc = App.activeDoc;
    if (doc == null) {
        return;
    }

    let selections = doc.GetSelection();
    if (selections.Count == 0) {
        return;
    }

    let width = doc.packageItem.width;

    flipHorizontalRelationAndPosition(selections, width);

    doc.SetModified(true);

    App.inspectorView.Refresh(INSPECTOR_NAME_RELATION);
});

addTool("创建当前包的阿语转置分支组件", "CreateArBranchComponentsInPackage", appToolMenu, function (params) {
    let folder = App.GetActiveFolder();
    if (folder == null) {
        return;
    }

    let packageObj = folder.owner;
    let items = [];

    for (let i = 0; i < packageObj.items.Count; i++) {
        let item = packageObj.items.get_Item(i);
        items.push(item);
    }

    createARBranchComponents(packageObj, items, true);
});

addTool("创建阿语转置分支组件", "CreateARBranchComponent", libMenu, function (params) {
    let selected = App.libView.GetSelectedResources(true);
    if (selected == null)
        return;

    let packageObj = null;
    let items = [];

    for (let i = 0; i < selected.Count; i++) {
        let item = selected.get_Item(i);

        console.log(item.name + " type:" + item.type);
        if (item.type != "component")
            continue;

        packageObj = item.owner;
        items.push(item);
    }

    if (items.length == 0)
        return;

    createARBranchComponents(packageObj, items, true);
})

addTool("创建阿语分支组件(不转置)", "CreateARBranchComponent", libMenu, function (params) {
    let selected = App.libView.GetSelectedResources(true);
    if (selected == null)
        return;

    let packageObj = null;
    let items = [];

    for (let i = 0; i < selected.Count; i++) {
        let item = selected.get_Item(i);

        console.log(item.name + " type:" + item.type);
        if (item.type != "component")
            continue;

        packageObj = item.owner;
        items.push(item);
    }

    if (items.length == 0)
        return;

    createARBranchComponents(packageObj, items, false);
})

addTool("对当前组件进行阿语转置", "TranslateARBranchComponent", libMenu, function (params) {
    let selected = App.libView.GetSelectedResources(true);
    if (selected == null)
        return;

    for (let i = 0; i < selected.Count; i++) {
        let item = selected.get_Item(i);

        console.log(item.name + " type:" + item.type);
        if (item.type != "component")
            continue;

        executeARTranslate(item);
    }
})

for (let i = 0; i < tools.length; i++) {
    let subTool = tools[i];
    let menu = subTool[KEY_CONTEXT];
    if (menu == null)
        continue;

    menu.AddItem(subTool[KEY_NAME], subTool[KEY_IDENTIFY], -1, false, subTool[KEY_FUNC]);
}

exports.onDestroy = function () {
    for (let i = 0; i < tools.length; i++) {
        let subTool = tools[i];
        let menu = subTool[KEY_CONTEXT];
        if (menu == null)
            continue;

        menu.RemoveItem(subTool[KEY_IDENTIFY]);
    }
}
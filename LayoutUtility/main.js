"use strict";

const csharp_1 = require("csharp");
const { __esModule } = require("../CustomAttributer");
const App = csharp_1.FairyEditor.App;
const FRelationType = csharp_1.FairyEditor.FRelationType;

let menu = App.docFactory.contextMenu;

let tools = [];

let KEY_NAME = "name";
let KEY_IDENTIFY = "identify";
let KEY_FUNC = "func";

let INSPECTOR_NAME_BASIC = "basic";
let INSPECTOR_NAME_RELATION = "relation";

let addTool = function (name, identify, func) {
    let tool = {};
    tool[KEY_NAME] = name;
    tool[KEY_IDENTIFY] = identify;
    tool[KEY_FUNC] = func;
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
let flipHorizontalRelation = function (obj) {
    let count = obj.relations.items.Count;
    for (let i = 0; i < count; i++) {
        let relationItem = obj.relations.items.get_Item(i);
        let defsCount = relationItem.defs.Count;
        for (let j = 0; j < defsCount; j++) {
            let relationItemDef = relationItem.defs.get_Item(j);

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
    }
}

addTool("位置水平翻转", "HorizontalPosFlip", function (params) {
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

addTool("水平关联翻转", "HorizontalRelationFlip", function (params) {
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

addTool("位置水平翻转&关联翻转", "HorizontalPosRelationFlip", function (params) {
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
        flipHorizontalRelation(selection);
    }

    doc.SetModified(true);

    App.inspectorView.Refresh(INSPECTOR_NAME_RELATION);
});

for (let i = 0; i < tools.length; i++) {
    let subTool = tools[i];
    menu.AddItem(subTool[KEY_NAME], subTool[KEY_IDENTIFY], -1, false, subTool[KEY_FUNC]);
}

exports.onDestroy = function () {
    for (let i = 0; i < tools.length; i++) {
        let subTool = tools[i];
        menu.RemoveItem(subTool[KEY_IDENTIFY]);
    }
}
function bindMainSidebarButtons() {
    
}

function bindMainTableButtons() {
    const tableNode = /** @type {HTMLElement} */ (document.querySelector("#main .content .container table"));
    tableNode.onclick = async event => {
        const target = /** @type {HTMLElement} */ (event.target);
        if(target.closest(".participant")) {
            if(target.closest(".checkbox")) {
                if(target.tagName === "INPUT") {
                    checkActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
                }
            } else if(target.closest(".actions") && target.tagName === "SPAN") {
                console.log("action")
            } else {
                const id = target.closest("tr")?.dataset.id;
                if(id) {
                    router(id);
                    load();
                }
            }
        } else if(target.closest("th")) {
            if(target.closest(".checkbox")) {
                if(target.tagName === "INPUT") {
                    const view = tableNode.getElementsByClassName("participant");
                    const state = /** @type {HTMLInputElement} */ (target);
                    for(const row of view) {
                        const checkbox = /** @type {HTMLInputElement} */ (row.querySelector("input"));
                        checkbox.checked = state.checked;
                    }
                    checkActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
                }
            } else {
                console.log("header")
            }
        }
    }
}

/**
 * @param {number} l 
 */
function checkActionButtons(l) {
    const actionNodes = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("#main .content .container .actions > div"));
    if(l > 0) {
        actionNodes[1].classList.remove("disabled");
        actionNodes[2].classList.remove("disabled");
        if(l > 1) {
            actionNodes[0].classList.remove("disabled");
        } else {
            actionNodes[0].classList.add("disabled");
        }
    } else {
        actionNodes[0].classList.add("disabled");
        actionNodes[1].classList.add("disabled");
        actionNodes[2].classList.add("disabled");
    }
}

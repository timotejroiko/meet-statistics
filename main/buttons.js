function bindMainSidebarButtons() {
    
}

function bindMainToolbarButtons() {
    const toolbar = /** @type {HTMLElement} */ (document.querySelector("#main .content .container .toolbar"));
    const tableView = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("#main .content .container table .participant"));

    const search = /** @type {HTMLInputElement} */ (toolbar.querySelector(".search input"));
    search.oninput = () => {
        const val = search.value.toLowerCase();
        if(val) {
            for(const row of tableView) {
                const content = row.querySelectorAll("p");
                if(Array.prototype.some.call(content, x => x.textContent.toLowerCase().includes(val))) {
                    row.classList.remove("hide");
                } else {
                    row.classList.add("hide");
                }
            }
        } else {
            for(const row of tableView) {
                row.classList.remove("hide");
            }
        }
    }

    const actions = /** @type {HTMLElement} */ (toolbar.querySelector(".actions"));
}

function bindMainTableButtons() {
    const tableNode = /** @type {HTMLElement} */ (document.querySelector("#main .content .container table"));
    tableNode.onclick = async event => {
        const target = /** @type {HTMLElement} */ (event.target);
        if(target.closest(".participant")) {
            if(target.closest(".checkbox")) {
                if(target.tagName === "INPUT") {
                    toggleActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
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
                    toggleActionButtons(tableNode.querySelectorAll(".participant .checkbox input:checked").length);
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
function toggleActionButtons(l) {
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

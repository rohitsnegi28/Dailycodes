const fetchDownstreamAndExpandTree = async ({ tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords, fetchHierarchyDownstreamFn }) => {
    let expandedNodes = {};
    let selectedRowIndex = '';
    let isExpansionAchieved = false;

    const expandCurrentNode = async (node) => {
        if (!node.children || node.children.length === 0) {
            node.children = await fetchHierarchyDownstreamFn(node, locale, setServerErrors, showTerminatedRecords);
        }

        if (selectedRowIndex.length === 0) {
            selectedRowIndex = `${expansionIndex}`;
        } else {
            selectedRowIndex = `${selectedRowIndex}-${expansionIndex}`;
        }

        const childIndex = node.children.findIndex(child => compareTwoNodes(child.code, movementData.movOrgCd, child.level, movementData[`movOrg${key}`]));
        if (childIndex > -1) {
            isExpansionAchieved = true;
            selectedRowIndex = `${selectedRowIndex}-${childIndex}`;
        }
    };

    const iterateNodesForExpansion = async (key, expansionIndex, currentMovLevelExpanded) => {
        for (const node of tree) {
            if (compareTwoNodes(node.code, movementData.movOrgCd, node.level, movementData.level)) {
                selectedRowIndex = '0';
                isExpansionAchieved = true;
                break;
            }

            if (compareTwoNodes(node.level, hierArr[key], node.code, movementData[`movOrg${key}`])) {
                await expandCurrentNode(node);
            }

            if (currentMovLevelExpanded) {
                break;
            }

            expansionIndex += 1;
        }
    };

    for (const key of Object.keys(hierArr)) {
        if (movementData[`movOrg${key}`]) {
            let currentMovLevelExpanded = false;
            let expansionIndex = 0;

            await iterateNodesForExpansion(key, expansionIndex, currentMovLevelExpanded);

            if (isExpansionAchieved) {
                break;
            }
        }
    }

    setExpandedNodes(expandedNodes);
    setSelectedRowIndex(selectedRowIndex);
};
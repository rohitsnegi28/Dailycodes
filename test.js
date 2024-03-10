const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords, reqObj) => {
    let nodes = tree;
    let tempExpandedNodes1 = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

    const processNodesSequentially = async () => {
        for (const node of nodes) {
            await processNode(node);
            if (isExpansionAchieved) break;
        }
    };

    const processNode = async (currentNode, index) => {
        if (!currentNode.children || currentNode.children.length === 0) {
            const children = await fetchHierarchyDownStream(currentNode, locale, setServerErrors, showTerminatedRecords);
            currentNode.children = children;
        }
        
        nodes = currentNode.children;
        const tempExpandedNodes = { ...tempExpandedNodes1 };
        tempExpandedNodes[index] = {};
        tempExpandedNodes1 = tempExpandedNodes;
        
        selectedRowString = selectedRowString ? `${selectedRowString}-${index}` : `${index}`;

        const childIndex = currentNode.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
        if (childIndex > -1) {
            isExpansionAchieved = true;
            selectedRowString = `${selectedRowString}-${childIndex}`;
        }
    };

    for (const key of Object.keys(hierArr)) {
        if (isExpansionAchieved || !movementData[`movOrg${key}`]) {
            continue;
        }

        await processNodesSequentially();
    }

    const expandedNodesCopy = { ...tempExpandedNodes1 };
    const selectedRowStringCopy = selectedRowString;
    setExpandedNodes(expandedNodesCopy);
    setSelectedRowIndex(selectedRowStringCopy);
};
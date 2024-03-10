const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
    let nodes = tree;
    let tempExpandedNodes1 = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

    const processNodesSequentially = async () => {
        for (const node of nodes) {
            await processNode({...node});
            if (isExpansionAchieved) break;
        }
    };

    const processNode = async (currentNode, index) => {
        let modifiedNode = {...currentNode}; // Create a copy of the currentNode
        if (!modifiedNode.children || modifiedNode.children.length === 0) {
            const children = await fetchHierarchyDownStream(modifiedNode, locale, setServerErrors, showTerminatedRecords);
            modifiedNode.children = children;
        }
        
        nodes = modifiedNode.children;
        const tempExpandedNodes = { ...tempExpandedNodes1 };
        tempExpandedNodes[index] = {};
        tempExpandedNodes1 = tempExpandedNodes;
        
        selectedRowString = selectedRowString ? `${selectedRowString}-${index}` : `${index}`;

        const childIndex = modifiedNode.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
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
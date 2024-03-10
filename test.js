const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
    let currentNodes = tree;
    let tempExpandedNodes = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

    const processNode = async (currentNode, nodeIndex) => {
        let modifiedNode = { ...currentNode };
        if (!modifiedNode.children || modifiedNode.children.length === 0) {
            modifiedNode.children = await fetchHierarchyDownStream(modifiedNode, locale, setServerErrors, showTerminatedRecords);
        }

        tempExpandedNodes[nodeIndex] = {};

        selectedRowString = selectedRowString ? `${selectedRowString}-${nodeIndex}` : `${nodeIndex}`;

        const foundChildIndex = modifiedNode.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
        if (foundChildIndex > -1) {
            isExpansionAchieved = true;
            selectedRowString = `${selectedRowString}-${foundChildIndex}`;
        }

        if (!isExpansionAchieved && modifiedNode.children) {
            return Promise.all(modifiedNode.children.map(async (childNode, childIndex) => {
                await processNode(childNode, childIndex);
            }));
        }
    };

    const processNodesSequentially = async () => {
        const promises = [];
        for (const [index, node] of currentNodes.entries()) {
            promises.push(processNode(node, index));
            if (isExpansionAchieved) {
                break;
            }
        }
        await Promise.all(promises);
    };

    for (const key of Object.keys(hierArr)) {
        if (!isExpansionAchieved && movementData[`movOrg${key}`]) {
            await processNodesSequentially();
        }
    }

    const expandedNodesCopy = { ...tempExpandedNodes };
    const selectedRowStringCopy = selectedRowString;
    setExpandedNodes(expandedNodesCopy);
    setSelectedRowIndex(selectedRowStringCopy);
};
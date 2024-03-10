
const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
    let currentNodes = tree;
    let tempExpandedNodes = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

    const processNode = async (currentNode, index) => {
        let modifiedNode = { ...currentNode };
        if (!modifiedNode.children || modifiedNode.children.length === 0) {
            modifiedNode.children = await fetchHierarchyDownStream(modifiedNode, locale, setServerErrors, showTerminatedRecords);
        }

        tempExpandedNodes[index] = {};

        selectedRowString = selectedRowString ? `${selectedRowString}-${index}` : `${index}`;

        const childIndex = modifiedNode.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
        if (childIndex > -1) {
            isExpansionAchieved = true;
            selectedRowString = `${selectedRowString}-${childIndex}`;
        }

        if (!isExpansionAchieved && modifiedNode.children) {
            const promises = modifiedNode.children.map(async (childNode, childIndex) => {
                await processNode(childNode, childIndex);
            });
            await Promise.all(promises);
        }
    };

    const processNodesSequentially = async () => {
        const promises = currentNodes.map(async (node, index) => {
            await processNode(node, index);
        });
        await Promise.all(promises);
    };

    for (const key of Object.keys(hierArr)) {
        if (isExpansionAchieved || !movementData[`movOrg${key}`]) {
            continue;
        }

        await processNodesSequentially();
    }

    const expandedNodesCopy = { ...tempExpandedNodes };
    const selectedRowStringCopy = selectedRowString;
    setExpandedNodes(expandedNodesCopy);
    setSelectedRowIndex(selectedRowStringCopy);
};
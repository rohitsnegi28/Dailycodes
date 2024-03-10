const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords, reqObj) => {
    let nodes = tree;
    let tempExpandedNodes1 = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

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
            return;
        }
    };

    const asyncTasks = [];
    for (const key of Object.keys(hierArr)) {
        if (isExpansionAchieved || !movementData[`movOrg${key}`]) {
            continue;
        }

        let i = 0;
        for (const node of nodes) {
            if (isExpansionAchieved) {
                break;
            }

            if (node.code === movementData.movOrgCd && node.level === movementData.level) {
                selectedRowString = '0';
                isExpansionAchieved = true;
                break;
            }
            
            if (node.level === hierArr[key] && node.code === movementData[`movOrg${key}`]) {
                asyncTasks.push(processNode(node, i));
                break;
            }
            
            i += 1;
        }
    }
    
    await Promise.all(asyncTasks);
    
    const expandedNodesCopy = { ...tempExpandedNodes1 };
    const selectedRowStringCopy = selectedRowString;
    setExpandedNodes(expandedNodesCopy);
    setSelectedRowIndex(selectedRowStringCopy);
};
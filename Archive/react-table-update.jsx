import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'; // Updated import for React Table v8
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { uniqueId } from '@customuilibrary/mux';
import TextFilter from './filters/TextFilter';
import IndeterminateCheckbox from './filters/IndeterminateCheckbox';
import { Wrapper, Table, NoData } from '../styledComponents';
import sortable from '../assets/images/default.svg';
import descend from '../assets/images/descend.svg';
import ascend from '../assets/images/ascend.png';
import './CustomGrid.scss';
import './CustomGridStyle.scss';
import { staticCommonLabelKeys } from '../../../../moduleConstants';
import { staticLabelKeys } from '../../../../../modules/agency/moduleConstants';

// ... (rest of the constants and helper functions remain the same)

const CustomGrid = ({ data, columns, onFilterChange, onSortByChange, isFilterable, onColumnResizeChange, isSortable,
  isColumnResizable, isSortIconClickable, hasRowSelect, allowClientSideInteractions, columnOrder, activateDataGrid,
  isPeriodDefinition, caption, getSelectedRows, isGroupBy, selectedRowIndex, onGridRowClick, isDependentGrid, lookup,
  hideChekAll, isManualAdj, displayAll, canClick, isDistinct, selectAll, intSelRows, checkboxAriaLabel, customNoDataMsg, isCompCheckbox }) => {
  const IconComponent = useCallback(({ row }) => (
    <div>
      <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} checkboxAriaLabel={checkboxAriaLabel} row={row} />
    </div>
  ));
  const pageSize = displayAll ? milion : fiveHundred;
  const [t] = useTranslation();
  const defaultColumn = useMemo(() => ({ Filter: TextFilter, minWidth: 30, width: 160, maxWidth: 400 }), []);
  const wrapperRef = useRef(null);
  const [flag, setFlag] = useState(false);
  const tbodyId = `tableBody-${uniqueId()}`;
  const privateObj = { key: 'private', operator: 'None', type: 'text', values: ['PRIVATE'] };
  const hasCheckbox = (toBool(hasRowSelect) && !isGroupBy);

  // Updated table instance for React Table v8
  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: true,
    manualSorting: !allowClientSideInteractions,
    manualPagination: !allowClientSideInteractions,
    autoResetSelectedRows: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      rowSelection: intSelRows || {},
    },
    // New prop for row selection in v8
    enableRowSelection: hasCheckbox,
    enableMultiRowSelection: !hideChekAll,
  });

  // Aliases for changed function names
  const getTableProps = table.getTableProps;
  const getTableBodyProps = table.getTableBodyProps;
  const headerGroups = table.getHeaderGroups();
  const page = table.getRowModel().rows;
  const prepareRow = table.prepareRow;
  const selectedFlatRows = table.getSelectedRowModel().flatRows;
  const setColumnOrder = table.setColumnOrder;
  const state = table.getState();

  useEffect(() => getHighlightedRow(), [data]);
  useEffect(() => getSelectedRows(selectedFlatRows), [selectedFlatRows]);
  useEffect(() => setColumnOrder(columnOrder), [columnOrder]);

  const onFilterChangeHandler = useAsyncDebounce((filtersVal) => {
    changeFilterHandlerFunc({ onFilterChange, filtersVal, columns, privateObj });
  }, notificationTime);

  useEffect(() => onFilterChangeHandler(state.columnFilters), [state.columnFilters]);
  useEffect(() => onSortByChange(state.sorting), [state.sorting]);
  useEffect(() => onColumnResizeChange(state.columnSizing), [state.columnSizing]);
  useOutsideAlerter(wrapperRef, tbodyId);
  useEffect(() => tableXYOverflowFunc({ columns, setFlag, data, t }), [columns[0]?.actions?.length, data?.length]);

  const isGroupByOrDistinct = activateDataGrid && (isGroupBy || isDistinct);
  const hasActionCol = headerGroups.some((group) => group.headers.some((header) => header.id === 'action'));

  return (
    <div ref={wrapperRef} className={initiateClass(hasRowSelect, isGroupBy, activateDataGrid, isDistinct)}>
      <Wrapper data-testid="CustomGridComponent">
        <Table {...getTableProps()} data-testid="TableComponent" style={!flag ? styleTable : {}}>
          <caption>{caption}</caption>
          {renderHeader({ flag, headerGroups, isFilterable, isColumnResizable, hasRowSelect, hasCheckbox, isGroupByOrDistinct, hasActionCol })}
          {page.length > 0 && (
          <tbody {...getTableBodyProps()} id={tbodyId}>
            {page.map((row, rowNum) => {
              prepareRow(row);
              const rowProps = row.getRowProps();
              return tableRow({ rowNum,
                row,
                rowProps,
                hasRowSelect,
                onGridRowClick,
                tbodyId,
                caption,
                isSelected: rowNum === selectedRowIndex,
                canClick: canClick === undefined ? true : canClick,
                flag,
              });
            })}
          </tbody>
          )}
          {page.length === 0 && showMessageOnNoData({ activateDataGrid, columns, isPeriodDefinition, t, isManualAdj, customNoDataMsg, lookup, isCompCheckbox })}
        </Table>
      </Wrapper>
    </div>
  );
};

// ... (PropTypes and defaultProps remain the same)

export default CustomGrid;

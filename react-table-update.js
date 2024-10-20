import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
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

// Constants remain the same

/**
 * Convert value to boolean
 * @param {string} val - 'true' or 'false'
 * @returns {boolean} - boolean true or false respectively
 */
const toBool = (val) => val === STR_TRUE || JSON.parse(val) === true;

// Other utility functions remain the same

/**
 * Custom React Table component
 * @param {Object} props - Component props
 */
const CustomGrid = ({
  data,
  columns,
  onFilterChange,
  onSortByChange,
  isFilterable,
  onColumnResizeChange,
  isSortable,
  isColumnResizable,
  isSortIconClickable,
  hasRowSelect,
  allowClientSideInteractions,
  columnOrder,
  activateDataGrid,
  isPeriodDefinition,
  caption,
  getSelectedRows,
  isGroupBy,
  selectedRowIndex,
  onGridRowClick,
  isDependentGrid,
  lookup,
  hideChekAll,
  isManualAdj,
  displayAll,
  canClick,
  isDistinct,
  selectAll,
  intSelRows,
  checkboxAriaLabel,
  customNoDataMsg,
  isCompCheckbox
}) => {
  const [t] = useTranslation();
  const [flag, setFlag] = useState(false);
  const tbodyId = `tableBody-${uniqueId()}`;
  const wrapperRef = useRef(null);

  const defaultColumn = useMemo(() => ({
    minSize: 30,
    size: 160,
    maxSize: 400,
  }), []);

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: !allowClientSideInteractions,
    manualSorting: !allowClientSideInteractions,
    manualPagination: !allowClientSideInteractions,
    enableRowSelection: toBool(hasRowSelect) && !isGroupBy,
    enableMultiRowSelection: true,
    enableColumnResizing: toBool(isColumnResizable),
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: displayAll ? milion : fiveHundred,
      },
      rowSelection: intSelRows || {},
    },
  });

  // Effects remain mostly the same, adjusted for new react-table API
  useEffect(() => {
    getSelectedRows(Object.keys(table.getState().rowSelection));
  }, [table.getState().rowSelection]);

  useEffect(() => {
    table.setColumnOrder(columnOrder);
  }, [columnOrder]);

  useEffect(() => {
    onFilterChange(table.getState().columnFilters);
  }, [table.getState().columnFilters]);

  useEffect(() => {
    onSortByChange(table.getState().sorting);
  }, [table.getState().sorting]);

  useEffect(() => {
    onColumnResizeChange(table.getState().columnSizing);
  }, [table.getState().columnSizing]);

  useOutsideAlerter(wrapperRef, tbodyId);

  useEffect(() => tableXYOverflowFunc({ columns, setFlag, data, t }), [columns[0]?.actions?.length, data?.length]);

  const isGroupByOrDistinct = activateDataGrid && (isGroupBy || isDistinct);
  const hasActionCol = table.getAllColumns().some(column => column.id === 'action');

  // Render functions
  const renderHeader = () => (
    <thead style={!flag ? styleJs : {}}>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header, index) => (
            <th
              key={header.id}
              colSpan={header.colSpan}
              style={{
                width: getheaderWidth(headerGroup.headers.length, header, hasRowSelect, isGroupByOrDistinct, hasActionCol),
              }}
            >
              {header.isPlaceholder ? null : (
                <>
                  <div
                    {...{
                      className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span aria-hidden="true">
                        {getSortStatus(header.column.getIsSorted())}
                      </span>
                    )}
                  </div>
                  {toBool(isFilterable) && header.column.getCanFilter() && (
                    <div>
                      <TextFilter column={header.column} table={table} />
                    </div>
                  )}
                </div>
              )}
              {toBool(isColumnResizable) && (
                <div
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                />
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );

  const renderBody = () => (
    <tbody {...getTableBodyProps()} id={tbodyId}>
      {table.getRowModel().rows.map((row, rowNum) => (
        <tr
          key={row.id}
          className={tableRowClass(row, rowNum === selectedRowIndex)}
          onClick={(e) => handleRowClick(e, hasRowSelect, row, rowNum, onGridRowClick, tbodyId)}
        >
          {row.getVisibleCells().map(cell => (
            <td
              key={cell.id}
              className={`${handleResize(cell.column.getIsResizing(), RESIZER_CELL)} col-${cell.column.id} row-${rowNum}
                ${cell.column.columnDef.gridClmClass || ''}`}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  return (
    <div ref={wrapperRef} className={initiateClass(hasRowSelect, isGroupBy, activateDataGrid, isDistinct)}>
      <Wrapper data-testid="CustomGridComponent">
        <Table {...getTableProps()} data-testid="TableComponent" style={!flag ? styleTable : {}}>
          <caption>{caption}</caption>
          {renderHeader()}
          {table.getRowModel().rows.length > 0 && renderBody()}
          {table.getRowModel().rows.length === 0 && showMessageOnNoData({
            activateDataGrid,
            columns,
            isPeriodDefinition,
            t,
            isManualAdj,
            customNoDataMsg,
            lookup,
            isCompCheckbox
          })}
        </Table>
      </Wrapper>
    </div>
  );
};

// PropTypes and default props remain the same

export default CustomGrid;
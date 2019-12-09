import React from 'react'
import { Button, Icon } from "antd"
import PropTypes from 'prop-types'


const btns_wrap = {
    display: "flex",
    justifyContent: "space-between"
}
const btn = {
    display: "flex"
}
const item = {
    marginRight: "10px"
}

const PeriodCompare = ({ comparePeriod, showExport, showAddGroup, onOpenModal, onCompareAllPeriod, onClearData, onExportToExcel, onOpenSetModal, showExportReport, onExportReport}) => {
    return (
        <div style={btns_wrap}>
            <div style={btn}>
                <Button onClick={onOpenModal} style={item}>
                    <Icon type="plus" />添加
                </Button>
                <Button onClick={onCompareAllPeriod} style={item}>
                    对比所有期数
                </Button>
                {
                    comparePeriod.length > 0 && 
                        <Button onClick={onClearData}>
                            清空
                        </Button>
                }
            </div>
            <div>
                {
                    showAddGroup && 
                        <Button className="export_excel_btn" onClick={onOpenSetModal} style={item}>
                            <Icon type="plus" />新增分组
                        </Button>
                }
                {
                    showExport && 
                        <Button className="export_excel_btn" icon="to-top" onClick={onExportToExcel}>
                            导出Excel
                        </Button>
                }
                {
                    showExportReport && 
                        <Button className="export_excel_btn" onClick={onExportReport}>
                            下载最新两期对比分析报告
                        </Button>
                }
            </div>
        </div>
    )
}

PeriodCompare.propTypes = {
    comparePeriod: PropTypes.array,
    showExport: PropTypes.bool,
    showAddGroup: PropTypes.bool,
    showExportReport: PropTypes.bool,
    onOpenModal: PropTypes.func,
    onCompareAllPeriod: PropTypes.func,
    onClearData: PropTypes.func,
    onExportToExcel: PropTypes.func,
    onExportReport: PropTypes.func
  }

export default PeriodCompare
import React, { useState, useEffect } from "react"
import "./coreData.scss"
import PeriodCompare from "../../components/periodCompare"
import { Table, Icon, message, notification, Modal, Button } from "antd"
import { getAllPeriod, getHolderFilePath, getCreditFilePath } from "../../utils/fileParse"
import { getRatio, getAverage, formatNumber } from "../../utils/common"
import ReactEcharts from 'echarts-for-react'
import appGlobal from '../../global/global'
import { word } from "../word/word"
const { remote } = window.require('electron')
const dialog = remote.dialog

notification.config({
    placement: 'topRight',
    top: 70,
    duration: 5
})

message.config({
    top: 100
})

const CoreData = () => {
    // 所有日期
    const [ allPeriodArr, setAllPeriodArr ] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    // 所有日期，及相应信息
    const [ allPeriodObjArr, setAllPeriodObjArr ] = useState([])
    // 所有日期的股东户数数据
    const [ accountNumberData, setAccountNumberData ] = useState({})
    // 选择的对比期数
    const [ selectPeriod, setSelectPeriod ] = useState([])
    // 户数对比的table
    const [ compareAccountTable, setCompareAccountTable ] = useState([])
    // 持股对比的table
    const [ compareAmountTable, setCompareAmountTable ] = useState([])
    // 弹框
    const [ visible, setVisible ] = useState(false)
    // 图表弹框
    const [ chartVisible, setChartVisible ] = useState(false)
    // 图表option
    const [ chartOption, setChartOption ] = useState({})

    const showExportReport = true
    // 左侧固定表格
    const leftFixedColumns = [
        {
            title: '数量情况',
            dataIndex: 'type',
            key: 'type',
            render: text => <span onClick={() => {showChart(text)}}>{text}<Icon type="bar-chart" style={{color: "#3B86FF", cursor: "pointer", marginLeft: "8px"}} /> </span>
        }
    ]
    const leftFixedDownColumns = [
        {
            title: '持股情况',
            dataIndex: 'type',
            key: 'type',
            render: text => <span onClick={() => {showChart(text)}}>{text}<Icon type="bar-chart" style={{color: "#3B86FF", cursor: "pointer", marginLeft: "8px"}} /> </span>
        }
    ]
    const leftFixedData = [
        {
            key: '1',
            type: '股东总数',
        },
        {
            key: '2',
            type: '机构股东',
        },
        {
            key: '3',
            type: '自然人股东',
        }
    ]
    const leftFixedDownData = [
        {
            key: '1',
            type: '户均持股',
        },
        {
            key: '2',
            type: '机构股东持股',
        },
        {
            key: '3',
            type: '机构股东户均持股',
        },
        {
            key: '4',
            type: '自然人股东持股',
        },
        {
            key: '5',
            type: '自然人股东户均持股'
        }
    ]
    // 股东户数表格
    const accountColumns = [
        {
            title: '股东数量（户）',
            dataIndex: 'acountNumber',
            key: 'acountNumber',
            align: "center",
            width: 120
        },
        {
            title: '占比（%）',
            dataIndex: 'ratio',
            key: 'ration',
            align: "center",
            width: 120
        },
        {
            title: '较上期占比变动（%）',
            dataIndex: 'ratioChange',
            key: 'ratioChange',
            align: "center",
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text}</span>
        }
    ]
    // 股东持股数据表格
    const amountColumns = [
        {
            title: '持股数量（股）',
            dataIndex: 'amountNumber',
            key: 'amountNumber',
            width: 120,
            align: "center"
        },
        {
            title: '持股比例（%）',
            dataIndex: 'ratio',
            key: 'ratio',
            width: 120,
            align: "center"
        },
        {
            title: '较上期占比变动（%）',
            dataIndex: 'ratioChange',
            key: 'ratioChange',
            align: "center",
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text}</span>
        }
    ]

    const openModal = () => {
        setVisible(true)
    }

    const handleOk = () => {
        let selectPeriod = []
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            let item = allPeriodObjArr[y]
            if (item.selected) {
                selectPeriod.push(item.value)
            }
        }
        selectPeriod.sort().reverse()
        setSelectPeriod(selectPeriod)
        setVisible(false)
        handleAccountData(selectPeriod, accountNumberData)
        handleAmountData(selectPeriod, accountNumberData)
    }

    const handleCancel = () => {
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            if (selectPeriod.includes(item.value)) {
                item.selected = true
            } else {
                item.selected = false
            }
        }
        setAllPeriodObjArr(allPeriodObjArr)
        setVisible(false)
    }

    // 选择对比期数
    const select = (index) => {
        let arr = allPeriodObjArr
        arr[index].selected = !arr[index].selected
        setAllPeriodObjArr([...arr])
    }

    // 对比所有期数
    const compareAllPeriod = () => {
        let selectPeriod = []
        allPeriodArr.forEach(item => {
            selectPeriod.push(item)
        })
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            item.selected = true
        }
        selectPeriod.sort().reverse()
        setSelectPeriod(selectPeriod)
        setAllPeriodObjArr(allPeriodObjArr)
        handleAccountData(selectPeriod, accountNumberData)
        handleAmountData(selectPeriod, accountNumberData)
    }
    // 清空对比期数
    const clearCompareData = () => {
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            item.selected = false
        }
        setSelectPeriod([])
        setAllPeriodObjArr(allPeriodObjArr)
        handleAccountData([], accountNumberData)
        handleAmountData([], accountNumberData)
    }

    // 清空某一期的对比
    const deleteCompare = (item) => {
        let periodArr = selectPeriod
        if (periodArr.indexOf(item.period) > -1) {
            periodArr.splice(periodArr.indexOf(item.period), 1)
        }
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            if (periodArr.indexOf(item.value) > -1) {
                item.selected = true
            } else {
                item.selected = false
            }
        }
        setAllPeriodObjArr(allPeriodObjArr)
        periodArr.sort().reverse()
        setSelectPeriod(periodArr)
        handleAccountData(periodArr, accountNumberData)
        handleAmountData(periodArr, accountNumberData)
    }
    const getAmountChartData = (periodArr, type) => {
        let data = []
        periodArr.forEach(item => {
            for(let i = 0; i < compareAmountTable.length; ++i) {
                if (item === compareAmountTable[i].period) {
                    data.push(compareAmountTable[i].data[type].amountNumberCopy)
                }
            }
        })
        return data
    }
    const getAccoutChartData = (periodArr, type) => {
        let data = []
        periodArr.forEach(item => {
            data.push(accountNumberData[item][type])
        })
        return data
    }
    // 显示chart 弹框
    const showChart = (text) => {
        let type = 1
        setChartVisible(true)
        let periodArr = selectPeriod.slice(0, 10).sort()
        let chartData = []
        if (text === "股东总数") {
            chartData = getAccoutChartData(periodArr, "total_account")
        } else if (text === "机构股东") {
            chartData = getAccoutChartData(periodArr, "org_account")
        } else if (text === "自然人股东") {
            chartData = getAccoutChartData(periodArr, "personal_account")
        } else if (text === "户均持股") {
            type = 2
            chartData = getAmountChartData(periodArr, 0)
        } else if (text === "机构股东持股") {
            type = 2
            chartData = getAmountChartData(periodArr, 1)
        } else if (text === "机构股东户均持股") {
            type = 2
            chartData = getAmountChartData(periodArr, 2)
        } else if (text === "自然人股东持股") {
            type = 2
            chartData = getAmountChartData(periodArr, 3)
        } else if (text === "自然人股东户均持股") {
            type = 2
            chartData = getAmountChartData(periodArr, 4)
        }
        let option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(67, 66, 93, 1)',
                textStyle: {
                    color: 'rgba(255,255,255,1);',
                    fontSize: 12,
                    lineHeight: 16
                }
            },
            grid: {
                left: 30,
                right: 40,
                containLabel: true
            },
            calculable: true,
            legend: {
                data: [ type === 1 ? `${text}(户)` : `${text}(股)`]
            },
            xAxis: [
                {
                    type: 'category',
                    name: '日期',
                    axisLine: {    // 轴线
                        show: true,
                        lineStyle: {
                            color: '#F1F1F3',
                            type: 'solid',
                            width: 1
                        }
                    },
                    nameTextStyle: {
                        color: '#00000072'
                    },
                    axisLabel: {
                        color: '#00000072'
                    },
                    axisTick: {    // 轴标记
                        show: false,
                    },
                    splitLine: {
                        show: false,
                    },
                    splitArea: {
                        show: false,
                    },
                    data: periodArr
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: type === 1 ? `${text}(户)` : `${text}(股)`,
                    axisLabel: {
                        color: '#00000072',
                        formatter: '{value}'
                    },
                    axisLine: {    // 轴线
                        show: true,
                        lineStyle: {
                            color: '#F1F1F3',
                            type: 'solid',
                            width: 1
                        }
                    },
                    nameTextStyle: {
                        color: '#00000072'
                    },
                    axisTick: {    // 轴标记
                        show: false,
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: '#F1F1F3',
                            type: 'solid',
                            width: 1
                        }
                    },
                    splitArea: {
                        show: false
                    }
                }
            ],
            series: [
                {
                    name: type === 1 ? `${text}(户)` : `${text}(股)`,
                    type: 'bar',
                    barWidth: 16,
                    itemStyle: {
                        normal: {
                            barBorderRadius: [10, 10, 0, 0],
                            color: '#FFB100'
                        }
                    },
                    data: chartData
                }
            ]
        }
        setChartOption(option)
    }

    const handleChartCancel = () => {
        setChartVisible(false)
    }

    const init = () => {
        let allPeriodArr = getAllPeriod()
        // 把导入的期数存在全局，在不同的页面可以访问到
        appGlobal.globalAllPeriod = Object.assign([], allPeriodArr)
        let allPeriodObjArr = []
        for (let i = 0; i < allPeriodArr.length; i++) {
            allPeriodObjArr.push({
                selected: i === 0 || i === 1 ? true : false,
                value: allPeriodArr[i]
            })
        }
        allPeriodArrCopy = allPeriodArr
        setAllPeriodArr([...allPeriodArr])
        setAllPeriodObjArr([...allPeriodObjArr])
    }

    // 处理股东户数的数据
    const handleAccountData = (selectPeriod, accountNumberData) => {
        let compareAccountTable = []
        for(let i = 0; i < selectPeriod.length; ++i) {
            let item = accountNumberData[selectPeriod[i]]
            // 如果这一期的数据不存在
            if (!item) {
                notification.error({
                    message: '数据提示',
                    description: `未查询到${selectPeriod[i]}期普通账户数据`
                })
            } else {
                let data = []
                let ratioChangeTotal = "0.00"
                let ratioChangeOrg = "0.00"
                let ratioChangePersonal = "0.00"
                if (selectPeriod[i+1] && accountNumberData[selectPeriod[i+1]]) {
                    let preItem = accountNumberData[selectPeriod[i+1]]
                    ratioChangeTotal = getRatio(item.total_account - preItem.total_account, preItem.total_account, false)
                    ratioChangeOrg = getRatio(item.org_account - preItem.org_account, preItem.org_account, false)
                    ratioChangePersonal = getRatio(item.personal_account - preItem.personal_account, preItem.personal_account, false)
                }
                let total = {
                    key: 1 + '',
                    acountNumber: formatNumber(item.total_account || 0),
                    ratio: "100.00",
                    ratioChange: ratioChangeTotal
                }
                let org = {
                    key: 2 + '',
                    acountNumber: formatNumber(item.org_account || 0),
                    ratio: getRatio(item.org_account, item.total_account, false),
                    ratioChange: ratioChangeOrg
                }
                let personal = {
                    key: 3 + '',
                    acountNumber: formatNumber(item.personal_account || 0),
                    ratio: getRatio(item.personal_account, item.total_account, false),
                    ratioChange: ratioChangePersonal
                }
                data = Array.of(total, org, personal)
                compareAccountTable.push({
                    period: selectPeriod[i],
                    data: data
                })
            }
        }
        console.log("compareAccountTable", compareAccountTable)
        setCompareAccountTable([...compareAccountTable])
    }

    // 处理持股的数据
    const handleAmountData = (selectPeriod, accountNumberData ) => {
        let compareAmountTable = []
        for(let i = 0; i < selectPeriod.length; ++i) {
            let item = accountNumberData[selectPeriod[i]]
            // 如果这一期的数据不存在
            if (item) {
                let data = []
                let allAverageNum = getAverage(item.total_amount, item.total_account)
                let allAverage = {
                    key: 1 + '',
                    amountNumber: formatNumber(allAverageNum || 0),
                    amountNumberCopy: allAverageNum,
                    ratio: getRatio(allAverageNum, item.total_amount, false),
                }
                let org = {
                    key: 2 + '',
                    amountNumber: formatNumber(item.org_amount || 0),
                    amountNumberCopy: item.org_amount,
                    ratio: getRatio(item.org_amount, item.total_amount, false),
                }
                let orgAverageNum = getAverage(item.org_amount, item.total_account)
                let orgAverage = {
                    key: 3 + '',
                    amountNumber: formatNumber(orgAverageNum || 0),
                    amountNumberCopy: orgAverageNum,
                    ratio: getRatio(orgAverageNum, item.total_amount, false),
                }
                let personal = {
                    key: 4 + '',
                    amountNumber: formatNumber(item.personal_amount || 0),
                    amountNumberCopy: item.personal_amount,
                    ratio: getRatio(item.personal_amount, item.total_amount, false),
                }
                let personalAverageNum = getAverage(item.personal_amount, item.total_account)
                let personalAverage = {
                    key: 5 + '',
                    amountNumber: formatNumber(personalAverageNum || 0),
                    amountNumberCopy: personalAverageNum,
                    ratio: getRatio(personalAverageNum, item.total_amount, false),
                }
                data = Array.of(allAverage, org, orgAverage, personal, personalAverage)
                compareAmountTable.push({
                    period: selectPeriod[i],
                    data: data
                })
            }
        }
        // 计算较上期变化
        for (let j = 0; j < compareAmountTable.length; ++j) {
            let ratioChangeAllAverage = "0.00"
            let ratioChangeOrg = "0.00"
            let ratioChangeOrgAverage = "0.00"
            let ratioChangePersonal = "0.00"
            let ratioChangePersonalAverage = "0.00"
            // 如果是最后一项
            if (j === compareAmountTable.length - 1) {
                compareAmountTable[j].data[0].ratioChange = ratioChangeAllAverage
                compareAmountTable[j].data[1].ratioChange = ratioChangeOrg
                compareAmountTable[j].data[2].ratioChange = ratioChangeOrgAverage
                compareAmountTable[j].data[3].ratioChange = ratioChangePersonal
                compareAmountTable[j].data[4].ratioChange = ratioChangePersonalAverage
            } else {
                let currentItem = compareAmountTable[j]
                let preItem = compareAmountTable[j + 1]
                // 户均较上期变化
                ratioChangeAllAverage = getRatio(currentItem.data[0].amountNumber - preItem.data[0].amountNumber, preItem.data[0].amountNumber, false)
                currentItem.data[0].ratioChange = ratioChangeAllAverage
                // 机构较上期变化
                ratioChangeOrg = getRatio(currentItem.data[1].amountNumber - preItem.data[1].amountNumber, preItem.data[1].amountNumber, false)
                currentItem.data[1].ratioChange = ratioChangeOrg
                // 机构户均较上期变化
                ratioChangeOrgAverage = getRatio(currentItem.data[2].amountNumber - preItem.data[2].amountNumber, preItem.data[2].amountNumber, false)
                currentItem.data[2].ratioChange = ratioChangeOrgAverage
                // 个人较上期变化
                ratioChangePersonal = getRatio(currentItem.data[3].amountNumber - preItem.data[3].amountNumber, preItem.data[3].amountNumber, false)
                currentItem.data[3].ratioChange = ratioChangePersonal
                // 个人户均较上期变化
                ratioChangePersonalAverage = getRatio(currentItem.data[4].amountNumber - preItem.data[4].amountNumber, preItem.data[4].amountNumber, false)
                currentItem.data[4].ratioChange = ratioChangePersonalAverage
            }
        }
        console.log("compareAmountTable", compareAmountTable)
        setCompareAmountTable([...compareAmountTable])
    }

    const exportReport = () => {
        if (allPeriodArr.length < 2) {
            message.warn('您需上传最新两期的数据，请先上传数据！')
            return
        }
        let prePeriod = allPeriodArr[1]
        let curPeriod = allPeriodArr[0]
        let preHolderData = getHolderFilePath(prePeriod, true);        // 上期普通数据
        let preCreditData = getCreditFilePath(prePeriod, true);        // 上期信用数据
        let curHolderData = getHolderFilePath(curPeriod, true);        // 当期普通数据
        let curCreditData = getCreditFilePath(curPeriod, true);        // 当期信用数据
        if (!curCreditData) {
            message.warn(`未查询到${curPeriod}期信用账户数据`)
            return
        }
        if (!curHolderData) {
            message.warn(`未查询到${curPeriod}期普通账户数据`)
            return
        }
        if (!preCreditData) {
            message.warn(`未查询到${prePeriod}期信用账户数据`)
            return
        }
        if (!preHolderData) {
            message.warn(`未查询到${prePeriod}期普通账户数据`)
            return
        }
        // 导出报告
        dialog.showOpenDialog({
            properties: [
                'openDirectory',
            ],
            filters: [
                { name: 'All', extensions: ['*'] },
            ]
        }, function (res) {
            //回调函数内容，此处是将路径内容显示在input框内
            if (Array.isArray(res) && res[0]) {
                message.loading("报告生成中")
                word(res[0], function (err) { 
                    if (err) { 
                        message.error(err.message)
                    } else {
                        message.success('导出报告成功',  1)
                    }
                }, curHolderData, preHolderData, curCreditData, preCreditData)
            }
        })
    } 

    useEffect(() => {
        init()
        if (allPeriodArrCopy.length > 0) {
            // 获取户数数据
            let accountNumberData = {}
            for(let i = 0; i < allPeriodArrCopy.length; ++i) {
                let item = allPeriodArrCopy[i]
                // 去拿T123的数据
                accountNumberData[item]= getHolderFilePath(item, true)
            }
            setAccountNumberData({...accountNumberData})
            console.log("accountNumberData", accountNumberData)
            // 默认展示最新两期的数据
            let selectPeriod = allPeriodArrCopy.length === 1 ? [allPeriodArrCopy[0]] : [allPeriodArrCopy[0], allPeriodArrCopy[1]]
            setSelectPeriod([...selectPeriod])
            // 处理数据
            if (selectPeriod.length === 0) {
                return
            } else {
                handleAccountData(selectPeriod, accountNumberData)
                handleAmountData(selectPeriod, accountNumberData)
            }
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="core-data">
            <PeriodCompare 
                comparePeriod = {selectPeriod}
                showExportReport = {showExportReport}
                onExportReport = {exportReport}
                onOpenModal = {openModal}
                onCompareAllPeriod = {compareAllPeriod}
                onClearData = {clearCompareData}
            />
            {
                compareAccountTable.length > 0 ? 
                    <div className="table-wrapper">
                        <div className="table-content">
                            <div className="left-fixed">
                                <div className="left-title"></div>
                                <Table columns={leftFixedColumns}  dataSource={leftFixedData} pagination={false} />
                            </div>
                            <div className="right-scroll">
                                <div className="right-content" style={{width: `${compareAccountTable.length * 420}px`}}>
                                    {
                                        compareAccountTable.map((item, i) => (
                                            <div key={i} className="compare-table">
                                                <div className="left-title">
                                                    {
                                                        i === 0 ? <span className="new-icon"></span> : ""
                                                    }
                                                    <span className="period">{item.period}</span>
                                                    <span>股东总数 { item.data[0].acountNumber}</span>
                                                    <span className="close-icon" onClick={() => {deleteCompare(item)}}></span>
                                                </div>
                                                <Table columns={accountColumns}  dataSource={item.data} pagination={false} />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="divider"></div>
                        <div className="table-content">
                        <div className="left-fixed">
                            <Table columns={leftFixedDownColumns}  dataSource={leftFixedDownData} pagination={false} />
                        </div>
                        <div className="right-scroll">
                            <div className="right-content" style={{width: `${compareAccountTable.length * 420}px`}}>
                                {
                                    compareAmountTable.map((item, i) => (
                                        <div key={i} className="compare-table">
                                            <Table columns={amountColumns}  dataSource={item.data} pagination={false} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    </div>
                    :
                    <div>
                        {
                            allPeriodArr.length === 0 ? 
                                <div className="add-compare-btn">没有查询到对比数据</div>
                                :
                                <div className="add-compare-btn">
                                    <Button type="default" icon="plus" onClick={openModal}>请添加对比期数</Button>
                                </div>
                        }
                    </div>
            }
            <Modal
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={"确定"}
                cancelText={"取消"}
                width={646}
            >
                <div className="modal-title">
                    添加对比期数
                </div>
                <div className="modal-btns">
                    {
                        allPeriodObjArr.map((item, index) => (
                            <a key={index} className={item.selected ? 'selected' : ''} onClick={() => {select(index)}}>
                                {item.value}
                                {
                                    index === 0 ? <i className="new-icon"></i> : ""
                                }
                            </a>
                        ))
                    }
                </div>
            </Modal>
            <Modal
                visible={chartVisible}
                onCancel={handleChartCancel}
                footer = {null}
                width={600}
            >
                <div>
                    <ReactEcharts option={chartOption} style={{ height: '300px', width: '100%' }} />
                </div>
            </Modal>
        </div>
    )
}

export default CoreData

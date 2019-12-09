import React, { useState, useEffect } from 'react'
import "./generalSituation.scss"
import ReactEcharts from "echarts-for-react"
import { Table, message } from "antd"
import { getAllPeriod, getHolderFilePath, getCreditFilePath } from "../../utils/fileParse"
import { formatNumber, getRatio, getChangedRatio } from "../../utils/common"

const GeneralSituation = () => {
    // 所有日期
    const [ allPeriodArr, setAllPeriodArr ] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    // 图
    const [ chartOption, setChartOption ] = useState({})
    // chart切换的数据
    let chartDataArr = []
    let chartRatioChangeArr = []
    const [ columns, setColumns ] = useState([])
    const [ dataSource, setDataSource ] = useState([])
    // 选中行
    const  [ selectedRowKeys, setSelectedRowKeys ] = useState(['creditHolderNumData'])

    // 所有期数的信用户数
    let creditHolderNumsCopy = []
    // 所有期数的总持股数
    let creditHolderStockNumsCopy = []
    // 所有期数的持股比例
    let amountRatioArrayCopy = []
    // 户均持股数
    let averageAmountArrayCopy = []

    const rowSelection = {
        hideDefaultSelections: true,
        type: 'radio',
        selectedRowKeys: selectedRowKeys,
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
            // 机构股东数 
            if (selectedRowKeys == 'creditHolderNumData') {
                for (const item of selectedRows[0].creditHolderNumData) {
                    chartDataArr.push(item.creditHolderNum)
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            } else if (selectedRowKeys == 'creditHolderStockAmountData') {
                for (const item of selectedRows[0].creditHolderStockAmountData) {
                    chartDataArr.push(item.creditAmount)
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            } else if (selectedRowKeys == 'creditAmountRatioData') {
                for (const item of selectedRows[0].creditAmountRatioData) {
                    chartDataArr.push(parseFloat(item.ratio));
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            } else if (selectedRowKeys == 'averageAmountData') {
                for (const item of selectedRows[0].averageAmountData) {
                    chartDataArr.push(item.averageAmount);
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            }
            setChartOption(getOptions(selectedRowKeys))
            setSelectedRowKeys(selectedRowKeys)
        }
    }

    // 计算信用股占总股本的比例
    const handleAmountRatio = (holderDataCopy, creditDataCopy, creditHolderStockNumsCopy) => {
        let amountSumArray = [] // 每期持股总数
        let amountRatioArray = [] // 每期持股比例
        for (let i = 0; i < holderDataCopy.length; i++) {
            let everyPeriodAmount = 0
            // 普通持股数
            if (holderDataCopy[i] == null) {
                everyPeriodAmount = 0
            } else if (holderDataCopy[i].total_amount) {
                everyPeriodAmount = holderDataCopy[i].total_amount * 1
            } else {
                for (let j = 0; j < holderDataCopy[i].recorders.length; j++) {
                    everyPeriodAmount += holderDataCopy[i].recorders[j].holder_amount * 1
                }
            }
            // 信用持股数
            if (creditDataCopy[i] == null) {
                everyPeriodAmount += 0
            } else if (creditDataCopy[i].total_amount) {
                everyPeriodAmount += creditDataCopy[i].total_amount * 1
            } else {
                for (let j = 0; j < creditDataCopy[i].recorders.length; j++) {
                    everyPeriodAmount += creditDataCopy[i].recorders[j].credit_amount * 1
                }
            }
            amountSumArray.push(everyPeriodAmount)
        }
        // 每期机构持股比例
        for (let i = 0; i < creditHolderStockNumsCopy.length; i++) {
            amountRatioArray.push(getRatio(creditHolderStockNumsCopy[i], amountSumArray[i], false))
        }
        amountRatioArrayCopy = amountRatioArray
        console.log("amountRatioArrayCopy", amountRatioArrayCopy)
    }

    // 计算变化率
    const getRatioFn = (arr, type = false) => {
        let result = []
        for (let i = 0; i < arr.length; i++) {
            let changeRatio
            let curData = arr[i]
            let preData
            if (i === 0) {
                changeRatio = '0.00'
            } else {
                preData = arr[i - 1]
                changeRatio = type ? getChangedRatio(parseFloat(curData), parseFloat(preData), true) : getChangedRatio(curData, preData, true)
            }
            result.push(changeRatio)
        }
        return result
    }

    const renderColumns = (item, type, cls) => {
        return (
            <div className="span1">
                <span className="span1_1">{formatNumber(item[type]) || 0} </span>
                <br />
                <span className={cls}>{cls === "up" ? "+" : ""}{item.changeRatio || 0}</span>
            </div>
        )
    }

    const handleData = (holderData, creditData) => {
        for (let i = 0; i < creditData.length; i++) {
            // 信用户数
            creditHolderNumsCopy.push(creditData[i].credit_account)
            // 信用持股数
            creditHolderStockNumsCopy.push(creditData[i].credit_amount)
            // 户均持股
            averageAmountArrayCopy.push(isNaN(creditData[i].credit_amount / creditData[i].credit_account) ? "0" : (creditData[i].credit_amount / creditData[i].credit_account).toFixed(0))
        }
        handleAmountRatio(holderData, creditData, creditHolderStockNumsCopy)
        let dataSource = [
            { creditHolderNumData: [] },
            { creditHolderStockAmountData: []},
            { creditAmountRatioData: [] },
            { averageAmountData: [] }
        ]
        // 较上期变化
        // 股东数
        let accountChangeRatioArray = getRatioFn(creditHolderNumsCopy)
        // 持股数
        let amountChangeRatioArray = getRatioFn(creditHolderStockNumsCopy)
        // 持股占比
        let ratioChangeArray = getRatioFn(amountRatioArrayCopy, true)
        // 户均持股数
        let averageChangeRatioArray = getRatioFn(averageAmountArrayCopy)
        let periodsArr = allPeriodArrCopy.slice(0, 10).reverse()
        for (let i = 0; i < periodsArr.length; i++) {
            let accountItem = {
                key: i + 1,
                period: periodsArr[i],
                creditHolderNum: creditHolderNumsCopy[i],
                changeRatio: accountChangeRatioArray[i]
            }
            let amountItem = {
                key: i + 1,
                creditAmount: creditHolderStockNumsCopy[i],
                changeRatio: amountChangeRatioArray[i]
            }
            let ratioItem = {
                key: i + 1,
                ratio: amountRatioArrayCopy[i],
                changeRatio: ratioChangeArray[i]
            }
            let averageItem = {
                key: i + 1,
                averageAmount: averageAmountArrayCopy[i],
                changeRatio: averageChangeRatioArray[i]
            }
            dataSource[0].creditHolderNumData.push(accountItem)
            dataSource[1].creditHolderStockAmountData.push(amountItem)
            dataSource[2].creditAmountRatioData.push(ratioItem)
            dataSource[3].averageAmountData.push(averageItem)
        }
        console.log("dataSource", dataSource)
        // 首次渲染的是机构股东户数的数据
        chartDataArr = creditHolderNumsCopy
        chartRatioChangeArr = accountChangeRatioArray
        setDataSource(dataSource)
        // 整理列的数据
        let columns = [
            {
                title: '期数',
                dataIndex: 1,
                key: 1,
                width: 130,
                align: 'left',
                render: (text, record, index) => {
                    if (index === 0) {
                        return (
                            <div className="span1">
                                <span className="span1_1">信用股东数(户) </span>
                                <br />
                                <span className="span1_2">较上期变化(%)</span>
                            </div>
                        )
                    }
                    if (index === 1) {
                        return (
                            <div className="span1">
                                <span className="span1_1">信用股东持股数(股) </span>
                                <br />
                                <span className="span1_2">较上期变化(%)</span>
                            </div>
                        )
                    }
                    if (index === 2) {
                        return (
                            <div className="span1">
                                <span className="span1_1">信用股东持股数占当期总股数比例(%) </span>
                                <br />
                                <span className="span1_2">较上期变化(%)</span>
                            </div>
                        )
                    }
                    if (index === 3) {
                        return (
                            <div className="span1">
                                <span className="span1_1">户均持股数(股) </span>
                                <br />
                                <span className="span1_2">较上期变化(%)</span>
                            </div>
                        )
                    }
                }
            }
        ]
        for (let i = 0; i < dataSource[0].creditHolderNumData.length; i++) {
            columns.push({
                title: dataSource[0].creditHolderNumData[i].period,
                dataIndex: dataSource[0].creditHolderNumData[i].key + 1,
                key: dataSource[0].creditHolderNumData[i].key + 1,
                width: 160,
                align: 'center',
                render: (text, record, index) => {
                    if (index === 0) {
                        let nItem = record.creditHolderNumData[i]
                        if (nItem.changeRatio > 0) {
                            return renderColumns(nItem, "creditHolderNum", "up")
                        } else if (nItem.changeRatio < 0) {
                            return renderColumns(nItem, "creditHolderNum", "down")
                        } else {
                            return renderColumns(nItem, "creditHolderNum", "span1_2")
                        }
                    }
                    if (index === 1) {
                        let sItem = record.creditHolderStockAmountData[i]
                        if (sItem.changeRatio > 0) {
                            return renderColumns(sItem, "creditAmount", "up")
                        } else if (sItem.changeRatio < 0) {
                            return renderColumns(sItem, "creditAmount", "down")
                        } else {
                            return renderColumns(sItem, "creditAmount", "span1_2")
                        }
                    }
                    if (index === 2) {
                        let aItem = record.creditAmountRatioData[i]
                        if (aItem.changeRatio > 0) {
                            return renderColumns(aItem, "ratio", "up")
                        } else if (aItem.changeRatio < 0) {
                            return renderColumns(aItem, "ratio", "down")
                        } else {
                            return renderColumns(aItem, "ratio", "span1_2")
                        }
                    }
                    if (index === 3) {
                        let vItem = record.averageAmountData[i]
                        if (vItem.changeRatio > 0) {
                            return renderColumns(vItem, "averageAmount", "up")
                        } else if (vItem.changeRatio < 0) {
                            return renderColumns(vItem, "averageAmount", "down")
                        } else {
                            return renderColumns(vItem, "averageAmount", "span1_2")
                        }
                    }
                }
            })
        }
        setColumns(columns)
        setChartOption(getOptions())
    }
    const getOptions = (type) => {
        type = type || 'creditHolderNumData'
        let legendData
        if (type == 'creditHolderNumData') {
            legendData = ['信用股东数(户)', '较上期变化(%)'];
        } else if (type == 'creditHolderStockAmountData') {
            legendData = ['持股数', '较上期变化(%)']
        } else if (type == 'creditAmountRatioData') {
            legendData = ['持股数占比', '较上期变化(%)']
        } else if (type == 'averageAmountData') {
            legendData = ['户均持股数', '较上期变化(%)']
        }
        let option = {
            tooltip: {
                trigger: 'axis',
            },
            calculable: true,
            legend: {
                data: legendData
            },
            grid: {
                left: 30,
                right: 30,
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
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
                    data: allPeriodArrCopy.slice(0, 10).reverse()
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: legendData[0],
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
                        show: false,
                    },
                },
                {
                    type: 'value',
                    name: legendData[1],
                    axisLabel: {
                        color: '#00000072',
                        formatter: '{value} %'
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
                        show: false,
                    },
                    splitArea: {
                        show: false,
                    },
                }
            ],
            series: [
                {
                    name: legendData[0],
                    type: 'bar',
                    barWidth: 16,
                    itemStyle: {
                        normal: {
                            barBorderRadius: [10, 10, 0, 0],
                            color: '#FFB100'
                        }
                    },
                    data: chartDataArr
                },
                {
                    name: legendData[1],
                    type: 'line',
                    itemStyle: {
                        normal: {
                            lineStyle: {
                                color: '#595959',
                                width: 2,
                            },
                        }
                    },
                    yAxisIndex: 1,
                    data: chartRatioChangeArr.map(item => isNaN(parseFloat(item)) ? "0.00" : parseFloat(item))
                }
            ]
        }
        return option
    }

    useEffect(() => {
        let allPeriodArr = getAllPeriod()
        allPeriodArrCopy = allPeriodArr
        setAllPeriodArr([...allPeriodArr])
        if (allPeriodArrCopy.length) {
            let holderData = [] // 普通股数据
            let creditData = [] // 信用股数据
            let periods = allPeriodArrCopy.slice(0, 10).sort()
            for (const period of periods) {
                creditData.push(getCreditFilePath(period, true))
                holderData.push(getHolderFilePath(period, true))
            }
            // 如果有一期没有导入信用数据，都会提示
            if (creditData.every(item => item == null)) {
                message.warn('您还未上传信用股东名册数据，请先上传数据！')
            } else {
                handleData(holderData, creditData)
            }
        } else {
            message.warn('您还未上传信用股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="general-situation">
            <div className="org-title">信用股东概况</div>
            <ReactEcharts option={chartOption} style={{ height: '300px', width: '100%' }} />
            <Table 
                dataSource={dataSource} 
                columns={columns}
                pagination={false} 
                rowKey={record => {for(let i in record) {return i}}} 
                rowSelection={rowSelection} 
            />
        </div>
    )
}

export default GeneralSituation
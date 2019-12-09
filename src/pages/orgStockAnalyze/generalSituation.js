import React, { useState, useEffect } from 'react'
import "./generalSituation.scss"
import ReactEcharts from "echarts-for-react"
import { Table, message } from "antd"
import { getAllPeriod, getHolderFilePath, getCreditFilePath } from "../../utils/fileParse"
import { formatNumber, getRatio, getChangedRatio } from "../../utils/common"


const GeneralSituation = () => {
    // 图
    const [ chartOption, setChartOption ] = useState({})
    // chart切换的数据
    let chartDataArr = []
    let chartRatioChangeArr = []
    // 所有日期
    const [ allPeriodArr, setAllPeriodArr ] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    const [ columns, setColumns ] = useState([])
    const [ dataSource, setDataSource ] = useState([])
    // 选中行
    const  [ selectedRowKeys, setSelectedRowKeys ] = useState(['orgHolderNumData'])

    // 所有期数的普通数据(临时使用)
    let holderDataCopy = []
    // 所有期数的信用数据(临时使用)
    let creditDataCopy = []
    // 所有期数的机构户数
    let orgAccountArrayCopy = []
    // 所有期数的总持股数
    let orgAmountSumArrayCopy = []
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
            if (selectedRowKeys == 'orgHolderNumData') {
                for (const item of selectedRows[0].orgHolderNumData) {
                    chartDataArr.push(item.orgHolderNum)
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            } else if (selectedRowKeys == 'orgHolderStockAmountData') {
                for (const item of selectedRows[0].orgHolderStockAmountData) {
                    chartDataArr.push(item.orgAmount)
                    chartRatioChangeArr.push(isNaN(parseFloat(item.changeRatio)) ? 0 : parseFloat(item.changeRatio))
                }
            } else if (selectedRowKeys == 'orgAmountRatioData') {
                for (const item of selectedRows[0].orgAmountRatioData) {
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
    // 机构股东数
    const handleOrgHolderNums = () => {
        let holderData = [] // 所有期数的普通数据
        let creditData = [] // 所有期数的信用数据
        let orgHolderArray = [] // 机构的普通股数据
        let orgCreditArray = [] // 机构的信用股数据
        let orgArray = [] // 合并机构的普通股和信用股
        let orgUniqueArray =[]
        let orgAccountArray = [] // 每期机构的数量
        let periods = allPeriodArrCopy.slice(0, 10).sort()
        for (let i = 0; i < periods.length && i < 11; i++) {
            // 获取普通持股数的数据
            holderData.push(getHolderFilePath(periods[i], true))
            // 获取信用持股数的数据
            creditData.push(getCreditFilePath(periods[i], true))
        }
        holderDataCopy = holderData
        creditDataCopy = creditData
        for (let i = 0; i < holderData.length; i++) {
            if (holderData[i] == null) {
                orgHolderArray.push([])
            } else {
                // 过滤出机构股东
                let orgHolder = holderData[i].recorders.filter(item => {
                    return String(item.holder_type).charAt(0) === '2'
                })
                orgHolderArray.push(orgHolder)
            }
            if (creditData[i] == null) {
                orgCreditArray.push([])
            } else {
                let orgCredit = creditData[i].recorders.filter(item => {
                    return item.holder_type === '机构'
                })
                orgCreditArray.push(orgCredit)
            }
        }
        // 下面这段代码的作用是如果普通股数据和信用股数据的股东不对应，就是普通股有这个股东，但是信用股没有，或者信用股有这个股东，但是普通股没有这个股东，所以需要合并，然后把共有的去重
        for (let i = 0; i < orgHolderArray.length; i++) {
            orgArray.push(orgHolderArray[i].concat(orgCreditArray[i]))
        }
        // 对普通机构股东和信用机构股东去重
        for (let i = 0; i < orgArray.length; i++) {
            let hash = {}
            orgUniqueArray.push(orgArray[i].reduce((current, next) => {
                if (!hash[next.id_number]) {
                    hash[next.id_number] = true
                    current.push(next)
                }
                return current
            }, []))
        }
        
        for (const item of orgUniqueArray) {
            orgAccountArray.push(item.length)
        }
        orgAccountArrayCopy = orgAccountArray
        console.log("orgAccountArrayCopy", orgAccountArrayCopy)
    }

    // 机构股东持股数
    const handleOrgHolderStockNums = () => {
        let orgHolderAmountArray = []  // 每期普通机构持股数
        let orgCreditAmountArray = [] // 每期信用机构持股数
        let orgAmountSumArray = [] // 每期机构股东持股数
        for (let i = 0; i < allPeriodArrCopy.length && i < 10; i++) {
            // 机构每期的普通持股数
            if (holderDataCopy[i] == null) {
                orgHolderAmountArray.push(0)
            } else {
                // 如果没有统计过的机构持股数，那么就把每个机构的持股数相加，算出一个总的持股数，因为T5没有这个统计数据
                if (holderDataCopy[i].org_amount) {
                    orgHolderAmountArray.push(holderDataCopy[i].org_amount * 1)
                } else {
                    // 过滤出机构股东
                    let orgHolder = holderDataCopy[i].recorders.filter(item => {
                        return String(item.holder_type).charAt(0) === '2'
                    }) 
                    let orgAmount = 0
                    for (const item of orgHolder) {
                        orgAmount += parseInt(item.holder_amount)
                    }
                    orgHolderAmountArray.push(orgAmount)
                }
            }
            // 机构每期的信用持股数
            if (creditDataCopy[i] == null) {
                orgCreditAmountArray.push(0)
            } else {
                if (creditDataCopy[i].org_amount) {
                    orgCreditAmountArray.push(creditDataCopy[i].org_amount * 1)
                } else {
                    let orgHolder = creditDataCopy[i].recorders.filter(item => {
                        return item.holder_type === '机构'
                    })
                    let orgAmount = 0;
                    for (const item of orgHolder) {
                        orgAmount += parseInt(item.credit_amount)
                    }
                    orgCreditAmountArray.push(orgAmount)
                }
            }
        }
        console.log(orgHolderAmountArray, orgCreditAmountArray)
        // 把普通股数据和信用股数据相加
        for (let i = 0; i < orgHolderAmountArray.length; i++) {
            orgAmountSumArray.push(orgHolderAmountArray[i] * 1 + orgCreditAmountArray[i] * 1)
        }
        orgAmountSumArrayCopy = orgAmountSumArray
        console.log("orgAmountSumArrayCopy", orgAmountSumArrayCopy)
    }

    // 机构股东持股数占比
    const handleOrgAmountRatio = () => {
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
        console.log('amountSumArray', amountSumArray)
        // 每期机构持股比例
        for (let i = 0; i < orgAmountSumArrayCopy.length; i++) {
            amountRatioArray.push(getRatio(orgAmountSumArrayCopy[i], amountSumArray[i], false))
        }
        amountRatioArrayCopy = amountRatioArray
        console.log("amountRatioArrayCopy", amountRatioArrayCopy)
    }

    // 机构户均持股数
    const handleAverageAmount = () => {
        let averageAmountArray = []
        for (let i = 0; i < orgAmountSumArrayCopy.length; i++) {
            averageAmountArray.push(parseInt((orgAmountSumArrayCopy[i] / orgAccountArrayCopy[i])))
        }
        averageAmountArrayCopy = averageAmountArray
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

    const getOptions = (type) => {
        type = type || 'orgHolderNumData'
        let legendData
        if (type == 'orgHolderNumData') {
            legendData = ['机构股东数(户)', '较上期变化(%)'];
        } else if (type == 'orgHolderStockAmountData') {
            legendData = ['持股数', '较上期变化(%)']
        } else if (type == 'orgAmountRatioData') {
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

    const renderColumns = (item, type, cls) => {
        return (
            <div className="span1">
                <span className="span1_1">{formatNumber(item[type]) || 0} </span>
                <br />
                <span className={cls}>{cls === "up" ? "+" : ""}{item.changeRatio || 0}</span>
            </div>
        )
    }

    const handleData = () => {
        handleOrgHolderNums()
        handleOrgHolderStockNums()
        handleOrgAmountRatio()
        handleAverageAmount()
        let dataSource = [
            { orgHolderNumData: [] },
            { orgHolderStockAmountData: []},
            { orgAmountRatioData: [] },
            { averageAmountData: [] }
        ]
        // 较上期变化
        if(allPeriodArrCopy.length > 0) {
            // 股东数
            let accountChangeRatioArray = getRatioFn(orgAccountArrayCopy)
            // 持股数
            let amountChangeRatioArray = getRatioFn(orgAmountSumArrayCopy)
            // 持股占比
            let ratioChangeArray = getRatioFn(amountRatioArrayCopy, true)
            // 户均持股数
            let averageChangeRatioArray = getRatioFn(averageAmountArrayCopy)
            let periodsArr = allPeriodArrCopy.slice(0, 10).reverse()
            for (let i = 0; i < periodsArr.length; i++) {
                let accountItem = {
                    key: i + 1,
                    period: periodsArr[i],
                    orgHolderNum: orgAccountArrayCopy[i],
                    changeRatio: accountChangeRatioArray[i]
                }
                let amountItem = {
                    key: i + 1,
                    orgAmount: orgAmountSumArrayCopy[i],
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
                dataSource[0].orgHolderNumData.push(accountItem)
                dataSource[1].orgHolderStockAmountData.push(amountItem)
                dataSource[2].orgAmountRatioData.push(ratioItem)
                dataSource[3].averageAmountData.push(averageItem)
            }
            console.log("dataSource", dataSource)
            // 首次渲染的是机构股东户数的数据
            chartDataArr = orgAccountArrayCopy
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
                                    <span className="span1_1">机构股东数(户) </span>
                                    <br />
                                    <span className="span1_2">较上期变化(%)</span>
                                </div>
                            )
                        }
                        if (index === 1) {
                            return (
                                <div className="span1">
                                    <span className="span1_1">机构股东持股数(股) </span>
                                    <br />
                                    <span className="span1_2">较上期变化(%)</span>
                                </div>
                            )
                        }
                        if (index === 2) {
                            return (
                                <div className="span1">
                                    <span className="span1_1">机构股东持股数占当期总股数比例(%) </span>
                                    <br />
                                    <span className="span1_2">较上期变化(%)</span>
                                </div>
                            )
                        }
                        if (index === 3) {
                            return (
                                <div className="span1">
                                    <span className="span1_1">机构户均持股数(股) </span>
                                    <br />
                                    <span className="span1_2">较上期变化(%)</span>
                                </div>
                            )
                        }
                    }
                }
            ]
            for (let i = 0; i < dataSource[0].orgHolderNumData.length; i++) {
                columns.push({
                    title: dataSource[0].orgHolderNumData[i].period,
                    dataIndex: dataSource[0].orgHolderNumData[i].key + 1,
                    key: dataSource[0].orgHolderNumData[i].key + 1,
                    width: 160,
                    align: 'center',
                    render: (text, record, index) => {
                        if (index === 0) {
                            let oItem = record.orgHolderNumData[i]
                            if (oItem.changeRatio > 0) {
                                return renderColumns(oItem, "orgHolderNum", "up")
                            } else if (oItem.changeRatio < 0) {
                                return renderColumns(oItem, "orgHolderNum", "down") 
                            } else {
                                return renderColumns(oItem, "orgHolderNum", "span1_2")
                            }
                        }
                        if (index === 1) {
                            let aItem = record.orgHolderStockAmountData[i]
                            if (aItem.changeRatio > 0) {
                                return renderColumns(aItem, "orgAmount", "up")
                            } else if (aItem.changeRatio < 0) {
                                return renderColumns(aItem, "orgAmount", "down") 
                            } else {
                                return renderColumns(aItem, "orgAmount", "span1_2")
                            }
                        }
                        if (index === 2) {
                            let rItem = record.orgAmountRatioData[i]
                            if (rItem.changeRatio > 0) {
                                return renderColumns(rItem, "ratio", "up")
                            } else if (rItem.changeRatio < 0) {
                                return renderColumns(rItem, "ratio", "down") 
                            } else {
                                return renderColumns(rItem, "ratio", "span1_2")
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
            console.log("columns", columns)
            setColumns(columns)
            setChartOption(getOptions())
        }
    }

    useEffect(() => {
        let allPeriodArr = getAllPeriod()
        allPeriodArrCopy = allPeriodArr
        setAllPeriodArr([...allPeriodArr])
        if (allPeriodArrCopy.length) {
            handleData()
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="general-situation">
            <div className="org-title">机构股东概况</div>
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
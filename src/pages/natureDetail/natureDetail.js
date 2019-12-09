import React, { useState, useEffect } from "react"
import "./natureDetail.scss"
import { formatNumber, getHolderByType, sortHolderAmount, getSumByPropert } from "../../utils/common"
import { getAllPeriod, getAllData } from "../../utils/fileParse"
import { Icon, Table } from "antd"
import ReactEcharts from 'echarts-for-react'

const NatureDetail = (props) => {
    // 股东性质相关信息
    const [ natureInfo, setNatureInfo ] = useState({})
    // 股东性质名册
    const [ natureName, setNatureName ] = useState("")
    const [allPeriodArr, setAllPeriodArr ] = useState([])
    let allPeriodArrCopy = allPeriodArr
    // 成员列表
    const [ membersArr, setMembersArr ] = useState([])
    // 图、表 期数对比
    const [ dataSource, setDataSource ] = useState([])
    const [ chartOptions, setChartOptions ] = useState({})

    const membersColumns = [
        {
            title: "股东名称",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "股东性质",
            dataIndex: "nature",
            key: "nature",
            align: "right"
        },
        {
            title: "持股数量(股)",
            dataIndex: "amount",
            key: "amount",
            align: "right",
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        },
        {
            title: "持股比例(%)",
            dataIndex: "ratio",
            key: "ratio",
            align: "right"
        },
        {
            title: "质押或冻结总数(股)",
            dataIndex: "pledgeAmount",
            key: "pledgeAmount",
            align: "right",
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }
    ]

    const columns = [
        {
            title: '期数',
            dataIndex: 'period',
            key: 'period'
        }, 
        {
            title: '合计持股数量(股)',
            dataIndex: 'holder_amount',
            key: 'holder_amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }, 
        {
            title: '合计持股比例(%)',
            dataIndex: 'ratio',
            key: 'ratio',
            align: 'center',
        },
        {
            title: '较上期持股比例变动(%)',
            dataIndex: 'ratioChange',
            key: 'ratioChange',
            align: 'center',
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}><i>{text > 0 ? "+" : ""}</i>{formatNumber(text)}</span>
        }, 
        {
            title: '普通持股数量(股)',
            dataIndex: 'normal_amount',
            key: 'normal_amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }, 
        {
            title: '信用持股数量(股)',
            dataIndex: 'credit_amount',
            key: 'credit_amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }
    ]

    const goBack = () => {
        return props.history.push('/')
    }

    const handleData = (allPeriod, natureNum, lastPeriod) => {
        let periods = allPeriod.slice(0, 10).sort()
        let allData = getAllData(periods)
        // 这是某一类股东性质的所有期数的数据
        let allNatureData = {}
        for (const key in allData) {
            if (allData.hasOwnProperty(key)) {
                allNatureData[key] = []
                // 先对持股数据相加，即普通股数量加上信用股数量
                allData[key].forEach(item => {
                    if(item.holder_type.toString() === natureNum) {
                        if (item.credit_account) {
                            // 如果是t3，那么holder_amount就是总的持股数，否则总持有数就是普通加上信用
                            item.holder_amount = item.file_type === "t3" ? item.holder_amount : (item.holder_amount ? item.holder_amount + item.credit_amount : item.credit_amount)
                        }
                        allNatureData[key].push(item)
                    }
                })
                allNatureData[key] = allNatureData[key].sort(sortHolderAmount)
            }
        }
        console.log("allNatureData", allNatureData)
        // 最新一期的数据
        let lastData = allNatureData[lastPeriod]
        let members = []
        let natureInfo = {
            amount: 0,
            ratio: 0
        }
        for(let i = 0, iLen = lastData.length; i < iLen; ++i) {
            let item = lastData[i]
            natureInfo.amount += item.holder_amount
            natureInfo.ratio += item.holder_ratio
            members.push({
                key: i,
                name: item.holder_name,
                nature: getHolderByType(item.holder_type),
                amount: item.holder_amount,
                ratio: item.ratio ? parseFloat((item.ratio * 1).toFixed(2)) : "0.00",
                pledgeAmount: item.pledge_amount
            })
        }
        natureInfo.ratio = natureInfo.ratio ? parseFloat((natureInfo.ratio * 1).toFixed(2)) : "0.00"
        setMembersArr(members)
        setNatureInfo(natureInfo)
        // 图表数据
        if (!(JSON.stringify(allNatureData) == "{}")) {
            let chartData = {
                holder_amount: [],
                ratio: []
            }
            let dataSource = []
            let pArr = allPeriodArrCopy.slice(0, 10).sort()
            for (let i = 0; i < periods.length; i++) {
                let item = periods[i]
                let dataItem = allNatureData[item]
                // 保证这一期里面有数据
                if (dataItem.length > 0) {
                    chartData.holder_amount.push(getSumByPropert(dataItem, 'holder_amount'))
                    chartData.ratio.push(parseFloat(getSumByPropert(dataItem, 'holder_ratio', true).toFixed(2)))
                    dataSource.push({
                        key: item,
                        period: item,
                        holder_amount: getSumByPropert(dataItem, 'holder_amount'),
                        ratio: parseFloat(getSumByPropert(dataItem, 'holder_ratio', true).toFixed(2)),
                        // 如果是t3, 那么取normal_amount， 否则取holder_amount - credit_amount 因为前面对holder_amount做了处理，holder_amount就是总的持股量，现在如果算普通持股，所以要减掉
                        normal_amount: dataItem[0].file_type ? getSumByPropert(dataItem, 'normal_amount') : (getSumByPropert(dataItem, 'holder_amount') - getSumByPropert(dataItem, 'credit_amount')),
                        credit_amount: getSumByPropert(dataItem, 'credit_amount')
                    })
                } else {
                    // 把对应的期数去掉
                    pArr.splice(i, 1)
                    allPeriodArrCopy = pArr
                    setAllPeriodArr(pArr)
                }
            }
            for (let j = 0; j < dataSource.length; ++j) {
                let ratioChange = "0.00"
                if (j === 0) {
                    dataSource[j].ratioChange = ratioChange
                } else {
                    let current = dataSource[j]
                    let pre = dataSource[j - 1]
                    current.ratioChange = (current.ratio - pre.ratio).toFixed(2)
                }
            }
            setDataSource(dataSource)
            // 图表数据
            getOptions(chartData)
        }

    }

    const getOptions = (chartData) => {
        let option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(67, 66, 93, 1)',
                textStyle: {
                    color: 'rgba(255,255,255,1);',
                    fontSize: 12,
                    lineHeight: 16,
                }
            },
            grid: {
                left: 20,
                right: 20,
                containLabel: true
            },
            calculable: true,
            legend: {
                data: ['股东持股数(股)', '持股占比']
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
                    axisTick: {// 轴标记
                        show: false,
                    },
                    splitLine: {
                        show: false,
                    },
                    splitArea: {
                        show: false,
                    },
                    data: allPeriodArrCopy.slice(0, 10).sort()
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    name: '持股数(股)',
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
                    name: '占比(%)',
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
                        show: true,
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
                    name: '股东持股数(股)',
                    type: 'bar',
                    barWidth: 16,
                    itemStyle: {
                        normal: {
                            barBorderRadius: [10, 10, 0, 0],
                            color: '#FFB100'
                        }
                    },
                    data: chartData.holder_amount
                },
                {
                    name: '持股占比',
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
                    data: chartData.ratio
                }
            ]
        }
        setChartOptions(option)
    }

    useEffect(() => {
        let params = props.location.query
        console.log("params", params)
        if (params) {
            setNatureName(params.name)
            let allPeriod = getAllPeriod()
            allPeriodArrCopy = allPeriod
            setAllPeriodArr(allPeriod)
            handleData(allPeriod, params.natureNum, params.period)
        }
    }, [])

    return (
        <div className="nature-detail">
            <div className="return-btn">
                <a onClick={goBack}><Icon type="left" /> 返回</a>
            </div>
            <div className="detail-title">{natureName}</div>
            <div className="column">
                <div className="col">合计持股数量(股): <span>{formatNumber(natureInfo.amount)}</span></div>
                <div className="col">合计持股比例(%)：<span>{natureInfo.ratio || '--' }</span></div>
            </div>
            <div className="detail-title">成员持股情况</div>
            <Table dataSource={membersArr} columns={membersColumns} pagination={false} />
            <div className="detail-title">合计持股变动情况</div>
            <ReactEcharts option={chartOptions} style={{ height: '300px', width: '100%' }} />
            <Table dataSource={dataSource} columns={columns} pagination={false} />
        </div>
    )
}

export default NatureDetail
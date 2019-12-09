import React, { useState, useEffect } from "react"
import "./holderDetail.scss"
import { Icon, Tag, Table } from "antd"
import { getAllDataByAccount, getAllPeriod } from "../../utils/fileParse"
import { getSumByPropert, getHolderByType, formatNumber} from "../../utils/common"
import ReactEcharts from 'echarts-for-react'

const HolderDetail = (props) => {
    // 股东基本信息
    const [ holderInfo, setHolderInfo ] = useState({}) 
    // 股东名字
    const [ name, setName ] = useState("")
    // 所有对比期数
    const [ allPeriodArr, setAllPeriodArr ] = useState([])
    // 有数据的期数
    const [ diffPeriodArr, setDiffPeriodArr ] = useState([])
    let diffPeriodArrCopy = diffPeriodArr
    // 股东类别
    const [ holderType, setHolderType ] = useState("")
    // 股东是个人还是机构 1--个人  2--机构
    const [ type, setType ] = useState(1)
    // 表格数据
    const [ dataSource, setDataSource ] = useState([])
    // 图表数据
    const [ chartOptions, setChartOptions ] = useState({})

    const columns = [
        {
            title: '期数',
            dataIndex: 'period',
            key: 'period'
        }, 
        {
            title: '持股数量(股)',
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
            title: '持股比例(%)',
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

    const [ columnsTable, setColumnsTable ] = useState(columns)

    const goBack = () => {
        return props.history.push('/')
    }

    const handleData = (allPeriod, idNumber, type = 1,  rankArr = []) => {
        let periods = allPeriod.slice(0, 10).sort()
        let idNumbers = [idNumber]
        let data = getAllDataByAccount(periods, idNumbers)
        // 排除掉没有数据的哪一期
        // 没有数据的期数
        let emptyPeriodArr = []
        for( let key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key].length === 0) {
                    delete data[key]
                    emptyPeriodArr.push(key)
                }
            }
        }
        // 把没有数据的期数从所有期数中去掉
        let a = new Set(periods)
        let b = new Set(emptyPeriodArr)
        let diffPeriod  = [...new Set([...a].filter(item => !b.has(item)))]
        diffPeriodArrCopy = diffPeriod
        setDiffPeriodArr(diffPeriod)
        console.log("detail data", data)
        // 对数据的普通数据 信用数据进行处理
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // 先对持股数据相加，即普通股数量加上信用股数量
                data[key].forEach(item => {
                    if (item.credit_account) {
                        // 如果是t3，那么holder_amount就是总的持股数，否则总持有数就是普通加上信用
                        item.holder_amount = item.file_type === "t3" ? item.holder_amount : (item.holder_amount ? item.holder_amount + item.credit_amount : item.credit_amount)
                    }
                })
            }
        }
        if (data) {
            let chartData = {
                holder_amount: [],
                ratio: []
            }
            let dataSource = []
            for (let i = 0; i < diffPeriod.length; i++) {
                let item = diffPeriod[i]
                chartData.holder_amount.push(getSumByPropert(data[item], 'holder_amount'));
                chartData.ratio.push(parseFloat(getSumByPropert(data[item], 'holder_ratio', true).toFixed(2)))
                dataSource.push({
                    key: item,
                    period: item,
                    rank: type === 2 ? "" : rankArr[i],
                    holder_amount: getSumByPropert(data[item], 'holder_amount'),
                    ratio: parseFloat(getSumByPropert(data[item], 'holder_ratio', true).toFixed(2)),
                    // 如果是t3, 那么取normal_amount， 否则取holder_amount
                    // 如果是t1和t5的一起合起来的数据，这里的holder_amount是总的，如果想获得普通的数据，还需要减掉信用数据
                    normal_amount: data[item][0].file_type ? getSumByPropert(data[item], 'normal_amount') : (getSumByPropert(data[item], 'holder_amount') - getSumByPropert(data[item], 'credit_amount')),
                    credit_amount: getSumByPropert(data[item], 'credit_amount')
                })
                // 把最新一期的数据单独赋值给HolderInfo
                if (i === diffPeriod.length - 1) {
                    data[item][0]['holder_ratio'] = data[item][0]['holder_ratio'] ? parseFloat((data[item][0]['holder_ratio'] * 1).toFixed(2)) : '--'
                    setHolderInfo(data[item][0])
                }
            }
            for (let j = 0; j < dataSource.length; ++j) {
                let ratioChange = "0.00"
                if (j === 0) {
                    dataSource[j].ratioChange = ratioChange
                } else {
                    if (j <= dataSource.length - 1) {
                        let current = dataSource[j]
                        let pre = dataSource[j - 1]
                        current.ratioChange = (current.ratio - pre.ratio).toFixed(2)
                    }
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
                    data: diffPeriodArrCopy.slice(0, 10).sort()
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
        if (params) {
            setName(params.name)
            setType(params.type)
            setHolderType(params.holderType)
            let allPeriod = getAllPeriod()
            setAllPeriodArr(allPeriod)
            if (params.type === 1) {
                let columns = [...columnsTable]
                let rankColumn = {
                    title: '排名',
                    dataIndex: 'rank',
                    key: 'rank',
                    width: 60
                }
                columns.splice(1, 0, rankColumn)
                setColumnsTable(columns)
            }
            handleData(allPeriod, params.idNumber, params.type, params.rank)
        }
    }, [])

    return (
        <div className="holder-detail">
            <div className="return-btn">
                <a onClick={goBack}><Icon type="left" /> 返回</a>
            </div>
            <div className="detail-title">股东基本信息</div>
            <div className="name-layout">
                <span className="name">{name}</span>
                <Tag color="blue" style={{ fontSize: 10 }}>{getHolderByType(holderType)}</Tag>
            </div>
            <div className="base-info-layout">
                <div className="column">
                    <div className="col">证件号码：<span>{holderInfo.id_number || '--'}</span></div>
                    <div className="col">持股数量(股)：<span>{formatNumber(holderInfo.holder_amount)}</span></div>
                </div>
                <div className="column">
                    <div className="col">持股比例(%)：<span>{holderInfo.holder_ratio}</span></div>
                    <div className="col">质押或冻结总数(股)：<span>{formatNumber(holderInfo.pledge_amount)}</span></div>
                </div>
                <div className="column">
                    <div className="col">普通账号：<span>{holderInfo.normal_account || '--'}</span></div>
                    <div className="col">普通账号持股：<span>{formatNumber(holderInfo.normal_amount || holderInfo.holder_amount)}</span></div>
                </div>
                <div className="column">
                    <div className="col">信用账号：<span>{holderInfo.credit_account || '--'}</span></div>
                    <div className="col">信用账号持股：<span>{formatNumber(holderInfo.credit_amount)}</span></div>
                </div>
                <div className="column">
                    <div className="col">邮政编码：<span>{holderInfo.postal_code || '--'}</span></div>
                    <div className="col">联系电话：<span>{holderInfo.phone || '--'}</span></div>
                </div>
                <div className="column">
                    <div className="col">通讯地址：<span>{holderInfo.address}</span></div>
                </div>
            </div>
            <div className="detail-title">股东持股变动情况</div>
            <ReactEcharts option={chartOptions} style={{ height: '300px', width: '100%' }} />
            <Table dataSource={dataSource} columns={columnsTable} pagination={false} />
        </div>
    )
}

export default HolderDetail
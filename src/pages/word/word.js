import {
    getAllData
} from '../../utils/fileParse'
import {
    sortHolderAmount,
    getChangedRatio,
    getRatio,
    formatNumber,
    sortCreditAmount,
    getHolderByType,
    getSumByPropert
} from '../../utils/common'
import appGlobal from '../../global/global'
import echarts from 'echarts'
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Media,
    Table,
    TableCell,
    TableRow,
    WidthType,
    VerticalAlign,
    AlignmentType
} from "docx"

const fs = window.require("fs")


export const word = (path, callback, data, preData, creditData, preCreditData) => {
    let allPeriod = appGlobal.globalAllPeriod
    let curPeriod = allPeriod[0]
    let prePeriod = allPeriod[1]
    const REPORT_DATE = curPeriod.slice(0, 4) + "年" + curPeriod.slice(4, 6) + "月" + curPeriod.slice(-2) + "日"
    const COMPARE_DATE = prePeriod.slice(0, 4) + "年" + prePeriod.slice(4, 6) + "月" + prePeriod.slice(-2) + "日"
    const COMPANY_NAME = data.company_name || ""

    class DocumentCreator {
        create(data, preData, creditData, preCreditData) {
            let summary = this.getSummary(data, preData, creditData, preCreditData)
            // 声明一个word文档
            const docmt = new Document({
                styles: {
                    paragraphStyles: [{
                            id: "Titleing1",
                            name: "Titleing 1",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 100,
                                font: "楷体",
                                bold: true
                            },
                            paragraph: {
                                alignment: AlignmentType.CENTER,
                                spacing: {
                                    before: 4000,
                                    after: 800
                                }
                            }
                        },
                        {
                            id: "Titleing2",
                            name: "Titleing 2",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 36,
                                font: "微软雅黑"
                            },
                            paragraph: {
                                alignment: AlignmentType.CENTER,
                                spacing: {
                                    before: 0,
                                    after: 5000
                                }
                            }
                        },
                        {
                            id: "Titleing3",
                            name: "Titleing 3",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 36,
                                font: "微软雅黑"
                            },
                            paragraph: {
                                alignment: AlignmentType.CENTER
                            }
                        },
                        {
                            id: "heading1",
                            name: "heading 1",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 45,
                                font: "微软雅黑"
                            },
                            paragraph: {
                                spacing: {
                                    before: 200,
                                    after: 300
                                }
                            }
                        },
                        {
                            id: "heading2",
                            name: "heading 2",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 30,
                                font: "楷体",
                                bold: true
                            },
                            paragraph: {
                                spacing: {
                                    before: 200,
                                    after: 300
                                }
                            }
                        },
                        {
                            id: "heading3",
                            name: "heading 3",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 30,
                                font: "楷体"
                            },
                            paragraph: {
                                spacing: {
                                    before: 100,
                                    after: 200
                                }
                            }
                        },
                        {
                            id: "tableHeadCenter",
                            name: "tableHead center",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 25,
                                font: "楷体"
                            },
                            paragraph: {
                                alignment: AlignmentType.CENTER,
                            }
                        },
                        {
                            id: "tableHead",
                            name: "table Head",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 25,
                                font: "楷体"
                            }
                        },
                        {
                            id: "describeSay",
                            name: "describe Say",
                            basedOn: "Normal",
                            next: "Normal",
                            quickFormat: true,
                            run: {
                                size: 25,
                                font: "楷体"
                            },
                            paragraph: {
                                indent: {
                                    left: 720,
                                },
                                spacing: {
                                    before: 100,
                                    after: 100
                                }
                            }
                        }

                    ]
                }
            });
            // 一个section就是一个页面
            docmt.addSection({
                properties: {},
                children: [
                    new Paragraph({
                        text: "股东持股分析报告",
                        style: "Titleing1"
                    }),
                    new Paragraph(this.createHomePage(REPORT_DATE, COMPARE_DATE)),
                    new Paragraph({
                        children: [new TextRun(`${COMPANY_NAME}有限公司`)],
                        style: "Titleing3",
                    })
                ]
            });

            try {
                // 第一部分
                let targ01 = summary[0].son
                let firstSection = {
                    children: [
                        new Paragraph({
                            text: "一、 股东总体情况",
                            style: "heading1"
                        })
                    ]
                }
                targ01.forEach((item, index) => {
                    if (index == 0) {
                        firstSection.children.push(this.createSubHeading(item.name));
                        firstSection.children.push(this.createDescribe(item.describe));
                        let myOption = this.getChartOption('股东总户数(户)', '户均持股数(股)', [REPORT_DATE, COMPARE_DATE], item.chartData.count, item.chartData.num, item.chartData.showYmax)
                        let baseSrc01 = this.createChart(myOption)
                        const image = Media.addImage(docmt, baseSrc01, 650, 300)
                        firstSection.children.push(new Paragraph(image))
                    } else if (index == 1) {
                        firstSection.children.push(this.createSubHeading(item.name));
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        firstSection.children.push(table)
                        firstSection.children.push(this.createDescribe(item.describe))
                    } else if (index == 2) {
                        firstSection.children.push(this.createSubHeading(item.name));
                        let myOption = this.getChartOption('信用持股数(股)', '信用股东数(户)', [REPORT_DATE, COMPARE_DATE], item.chartData.count, item.chartData.num, item.chartData.showYmax);
                        let baseSrc01 = this.createChart(myOption);
                        const image = Media.addImage(docmt, baseSrc01, 650, 300)
                        firstSection.children.push(new Paragraph(image))
                        firstSection.children.push(this.createDescribe(item.describe))
                    } else if (index == 3) {
                        firstSection.children.push(this.createSubHeading(item.name))
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        firstSection.children.push(table)
                        firstSection.children.push(this.createDescribe(item.describe))
                    }
                })
                docmt.addSection(firstSection)

                // 第二部分
                let targ02 = summary[1].son;
                let secondSection = {
                    children: [
                        new Paragraph({
                            text: "二、 股东结构",
                            style: "heading1"
                        })
                    ]
                }
                targ02.forEach((item, index) => {
                    if (index == 0) {
                        secondSection.children.push(this.createSubHeading(item.name))
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        secondSection.children.push(table)
                        secondSection.children.push(this.createDescribe(item.describe))
                    } else if (index == 1) {
                        secondSection.children.push(this.createSubHeading(item.name))
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        secondSection.children.push(table)
                        secondSection.children.push(this.createDescribe(item.describe))
                        let myOption = this.getChartOption('股东个数', '持股占比(%)', ['1亿股以上', '1000万股~1亿股', '100万股~1000万股', '50万股~100万股', '10万股~50万股', '10万股'], item.chartData.count, item.chartData.num, 1)
                        let baseSrc01 = this.createChart(myOption)
                        const image = Media.addImage(docmt, baseSrc01, 650, 300)
                        secondSection.children.push(new Paragraph(image))
                    }
                })
                docmt.addSection(secondSection)

                // 第三部分
                let targ03 = summary[2].son
                let thirdSection = {
                    children: [
                        new Paragraph({
                            text: "三、 股东持股变化情况",
                            style: "heading1"
                        })
                    ]
                }
                targ03.forEach((item, index) => {
                    if (index == 0) {
                        thirdSection.children.push(this.createSubHeading(item.name))
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        thirdSection.children.push(table)
                        thirdSection.children.push(this.createDescribe(item.describe))
                    } else if (index == 1) {
                        thirdSection.children.push(this.createSubHeading(item.name))
                        thirdSection.children.push(this.createDescribe(item.describe))
                    } else if (index == 2) {
                        thirdSection.children.push(this.createSubHeading(item.name));
                        thirdSection.children.push(this.createDescribe(item.describe));
                    }
                    if (item.son) {
                        let thirdTab = item.son;
                        thirdTab.forEach(tar => {
                            thirdSection.children.push(new Paragraph({
                                text: tar.name,
                                style: "heading3"
                            }));
                            if (tar.showTable) {
                                let rows = []
                                this.createTable(rows, item.tableData)
                                const table = new Table({
                                    rows: rows,
                                    width: {
                                        size: 9535,
                                        type: WidthType.DXA
                                    }
                                })
                                thirdSection.children.push(table)
                            };
                            thirdSection.children.push(this.createDescribe(tar.describe))
                        })
                    }
                })
                docmt.addSection(thirdSection)

                // 第四部分
                let targ04 = summary[3].son;
                let fourSection = {
                    children: [
                        new Paragraph({
                            text: "四、 重要股东变化情况",
                            style: "heading1"
                        })
                    ]
                }
                targ04.forEach(item => {
                    fourSection.children.push(this.createSubHeading(item.name))
                    if (item.showTable) {
                        let rows = []
                        this.createTable(rows, item.tableData)
                        const table = new Table({
                            rows: rows,
                            width: {
                                size: 9535,
                                type: WidthType.DXA
                            }
                        })
                        fourSection.children.push(table)
                    }
                    fourSection.children.push(this.createDescribe(item.describe))
                })
                docmt.addSection(fourSection)

                return docmt;
            } catch (error) {
                console.warn('exportWord!!!', error);
            }
        }

        createChart(option) {
            let baseSrc;
            var oDiv = document.createElement('div');
            oDiv.style.width = '1000px';
            oDiv.style.height = '400px';
            let myChart = echarts.init(oDiv);
            myChart.setOption(option, true);
            baseSrc = myChart.getDataURL();
            return baseSrc
        }
        getChartOption(legend01, legend02, xAxisData, series01, series02, yMax = null) { //双Y轴
            let chartOption = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(67, 66, 93, 1)',
                    textStyle: {
                        color: 'rgba(255,255,255)',
                        fontSize: 20,
                        lineHeight: 16
                    }
                },
                grid: {
                    left: 10,
                    right: 10,
                    containLabel: true
                },
                calculable: true,
                legend: {
                    data: [legend01, legend02]
                },
                xAxis: [{
                    type: 'category',
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: 'black',
                            type: 'solid',
                            width: 2
                        }
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: false,
                    },
                    splitArea: {
                        show: false,
                    },
                    data: xAxisData
                }],
                yAxis: [{
                        type: 'value',
                        name: legend01,
                        axisLabel: {
                            color: 'black',
                            formatter: '{value}'
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#3B86FF',
                                type: 'solid',
                                width: 2
                            }
                        },
                        nameTextStyle: {
                            color: 'black'
                        },
                        axisTick: {
                            show: true,
                            inside: true
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
                        }
                    },
                    {
                        type: 'value',
                        name: legend02,
                        axisLabel: {
                            color: 'black',
                            formatter: '{value}'
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: 'tomato',
                                type: 'solid',
                                width: 2
                            }
                        },
                        nameTextStyle: {
                            color: 'black'
                        },
                        max: yMax,
                        axisTick: {
                            show: true,
                            inside: true
                        },
                        splitLine: {
                            show: false,
                        },
                        splitArea: {
                            show: false,
                        }
                    }
                ],
                series: [{
                        name: legend01,
                        type: 'bar',
                        animation: false,
                        barWidth: 35,
                        itemStyle: {
                            normal: {
                                color: '#3B86FF',
                                label: {
                                    show: true,
                                    position: 'top',
                                    textStyle: {
                                        color: 'black',
                                        fontSize: 15
                                    }
                                }
                            }
                        },
                        data: series01
                    },
                    {
                        name: legend02,
                        type: 'line',
                        animation: false,
                        itemStyle: {
                            normal: {
                                lineStyle: {
                                    color: 'tomato',
                                    width: 2,
                                },
                                label: {
                                    show: true,
                                    position: 'right',
                                    textStyle: {
                                        color: 'black',
                                        fontSize: 15
                                    }
                                }
                            }
                        },
                        yAxisIndex: 1,
                        data: series02
                    }
                ]
            }
            return chartOption;
        }
        createTable(row, arr) {
            for (let i = 0; i < arr.length; i++) {
                let children = []
                for (let attr in arr[i]) {
                    children.push(new TableCell({
                        children: [new Paragraph({
                            text: arr[i][attr].toString(),
                            alignment: AlignmentType.CENTER
                        })],
                        verticalAlign: VerticalAlign.CENTER
                    }))
                }
                row.push(new TableRow({
                    children: children
                }))
            }
        }
        createHomePage(reportDate, compareDate) {
            const paragraph = {
                children: [
                    new TextRun(`报告期: ${reportDate}`),
                    new TextRun(`( 对比期: ${compareDate} )`).break()
                ],
                style: "Titleing2"
            };
            return paragraph;
        }
        createDescribe(des) {
            const paragraph = {
                children: [],
                style: "describeSay"
            };
            des.forEach((item, index) => {
                let say;
                if (index == 0) {
                    say = new TextRun(item);
                } else {
                    say = new TextRun(item).break();
                }
                paragraph.children.push(say);
            })
            return new Paragraph(paragraph);
        }
        createSubHeading(text) {
            return new Paragraph({
                children: [
                    new TextRun(text)
                ],
                style: "heading2"
            })
        }

        createTableHead(text) {
            return new Paragraph(text).style('tableHead');
        }

        createTableHeadCenter(text) {
            return new Paragraph(text).style('tableHeadCenter');
        }

        compareRes(main, preMain, unit) {
            let res = ((main - preMain) * 1).toFixed(2);
            if (res > 0) {
                return "增加" + formatNumber(res) + unit
            } else if (res == 0) {
                return "持平"
            } else {
                return "减少" + formatNumber(res * -1) + unit
            }
        }

        compareRatio(num) {
            let tar = parseFloat(num);
            if (isNaN(tar)) {
                return '暂无对比结果';
            } else if (tar > 0) {
                return "环比上升" + tar + "%";
            } else if (tar == 0) {
                return "环比持平";
            } else {
                return "环比下降" + tar * -1 + "%";
            }
        }

        averageNum(o1, o2, percent = true) {
            if (isNaN(o1) || isNaN(o2) || parseInt(o2) === 0) {
                if (percent) {
                    return '--';
                } else {
                    return 0;
                }
            }
            let ratio = o1 / o2;
            return parseFloat((ratio * 1).toFixed(2));
        }

        toPercent(num) {
            return (Math.round(num * 100) / 100).toFixed(2) + '%';
        }
        toNumPoint(percent) { //"0.00%" => 0
            let num = percent.replace("%", "");
            num = num * 1;
            return num;
        }
        //获取前n名累计数据及变化情况
        getTopNum(num, now, pre, credit) {
            let obj = {
                name: '前' + num + '名股东',
                count: 0,
                pre_count: 0,
                ratio: 0,
                pre_ratio: 0,
                change_count: 0,
                change_ratio: 0,
                normal_count: 0,
                credit_count: 0
            }
            if (pre && pre.recorders) {
                pre.recorders = pre.recorders.sort(sortHolderAmount);
                for (let i = 0; i < pre.recorders.length; i++) {
                    let d = pre.recorders[i];
                    d.holder_amount = parseInt(d.holder_amount);
                    d.holder_ratio = parseFloat((d.holder_ratio * 1).toFixed(4));
                    if (i < num) {
                        obj.pre_count += d.holder_amount;
                        obj.pre_ratio = obj.pre_ratio.add(d.holder_ratio);
                    }
                }
            }
            if (now.recorders) {
                now.recorders = now.recorders.sort(sortHolderAmount);
                for (let i = 0; i < now.recorders.length; i++) {
                    const e = now.recorders[i];
                    e.holder_amount = parseInt(e.holder_amount);
                    e.holder_ratio = parseFloat((e.holder_ratio * 1).toFixed(4));
                    if (i < num) {
                        obj.count += e.holder_amount;
                        obj.normal_count += e.normal_count || 0;
                        obj.credit_count += e.credit_count || 0;
                        obj.ratio = obj.ratio.add(e.holder_ratio);
                    }
                }
            }
            if (!now.credit_account && credit.recorders) {
                credit.recorders = credit.recorders.sort(sortCreditAmount);
                for (let i = 0; i < credit.recorders.length; i++) {
                    let c = credit.recorders[i];
                    c.credit_amount = parseInt(c.credit_amount);
                    if (i < num) {
                        obj.credit_count += c.credit_amount;
                    }
                }
            }
            obj.change_count = obj.count - obj.pre_count;
            obj.change_ratio = obj.ratio.sub(obj.pre_ratio);
            return obj;
        }
        //获取前10名所有机构股东信息，每个机构股东持股数与上期持股数对比，判断增持或减持
        getTopTen(preData, data, preCreditData, creditData) { //获取前10名
            if (!preData) preData = {};
            if (!preCreditData) preCreditData = {};
            if (!creditData) creditData = {};
            if (data && data.recorders) {
                data.recorders = data.recorders.sort(sortHolderAmount)
                let len = data.recorders.length;
                if (len <= 10) {
                    for (let i = 0; i < data.recorders.length; i++) {
                        let d = data.recorders[i];
                        d.key = i + 1;
                        d.holder_type = d.holder_type.toString();
                        d.holder_amount = parseInt(d.holder_amount);
                        d.holder_ratio = parseFloat((d.holder_ratio * 1).toFixed(4));
                        d.normal_amount = d.normal_amount || d.holder_amount;
                        if (preData && preData.recorders) {
                            for (let j = 0; j < preData.recorders.length; j++) {
                                let p = preData.recorders[j];
                                if (d.id_number == p.id_number) {
                                    d.pre_amount = parseInt(p.holder_amount)
                                    d.pre_ratio = parseFloat((p.holder_ratio * 1).toFixed(4))
                                    d.change_amount = d.holder_amount - d.pre_amount;
                                    d.change_ratio = d.holder_ratio.sub(d.pre_ratio);
                                }
                            }
                        } else {
                            d.pre_amount = null;
                            d.pre_ratio = 0;
                            d.change_amount = d.holder_amount;
                            d.change_ratio = d.holder_ratio;
                        }
                        if (creditData && creditData.recorders) {
                            for (let m = 0; m < creditData.recorders.length; m++) {
                                let p = creditData.recorders[m];
                                if (d.id_number == p.id_number) {
                                    d.credit_amount = parseInt(p.credit_amount)
                                    d.normal_amount = d.normal_amount || d.holder_amount;
                                }
                            }
                        } else {
                            d.credit_amount = parseInt(d.credit_amount || 0);
                            d.normal_amount = d.normal_amount || d.holder_amount;
                        }
                    }
                } else {
                    for (let i = 0; i < 10; i++) {
                        let d = data.recorders[i];
                        d.key = i + 1;
                        d.holder_type = d.holder_type.toString();
                        d.holder_amount = parseInt(d.holder_amount);
                        d.holder_ratio = parseFloat((d.holder_ratio * 1).toFixed(4));
                        d.normal_amount = d.normal_amount || d.holder_amount;
                        if (preData && preData.recorders) {
                            for (let j = 0; j < preData.recorders.length; j++) {
                                let p = preData.recorders[j];
                                if (d.id_number == p.id_number) {
                                    d.pre_amount = parseInt(p.holder_amount)
                                    d.pre_ratio = parseFloat((p.holder_ratio * 1).toFixed(4))
                                    d.change_amount = d.holder_amount - d.pre_amount;
                                    d.change_ratio = d.holder_ratio.sub(d.pre_ratio);
                                }
                            }
                        } else {
                            d.pre_amount = null;
                            d.pre_ratio = 0;
                            d.change_amount = d.holder_amount;
                            d.change_ratio = d.holder_ratio;
                        }
                        if (creditData && creditData.recorders) {
                            for (let m = 0; m < creditData.recorders.length; m++) {
                                let p = creditData.recorders[m];
                                if (d.id_number == p.id_number) {
                                    d.credit_amount = parseInt(p.credit_amount)
                                    d.normal_amount = d.normal_amount || d.holder_amount;
                                }
                            }
                        } else {
                            d.credit_amount = parseInt(d.credit_amount || 0);
                            d.normal_amount = d.normal_amount || d.holder_amount;
                        }
                    }
                }
            };
            return data.recorders
        }

        retStr(num, str01, str02) { ///(0, "增持", "机构股东")
            if (num == 0) {
                return "无" + str02 + str01
            } else {
                return str01 + str02 + num + "家"
            }
        }
        recorderData(obj = {}, data = []) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let recorders = obj[key];
                    let amounts = 0;
                    for (const recorder of recorders) {
                        if (recorder.holder_amount) {
                            amounts += recorder.holder_amount * 1;
                        } else if (recorder.credit_amount) {
                            amounts += recorder.credit_amount * 1;
                        }
                    }
                    recorders[0].amounts = amounts;
                    data.push(recorders[0])
                }
            }
            return data;
        }

        classifyByIdNumber(arr = []) {
            let hash = {};
            for (let i = 0; i < arr.length; i++) {
                if (hash[arr[i].id_number] == undefined) {
                    hash[arr[i].id_number] = []
                }
                hash[arr[i].id_number].push(arr[i])
            }
            return hash
        }
        handleListData(data, preData, creditData, preCreditData) { //获取机构股东数据列表
            let orgAmountSum = 0; // 当期机构持股总数
            let orgHolder, orgCredit, org; // 机构股东

            // 过滤机构普通股东
            if (data) {
                orgHolder = data.recorders.filter(item => {
                    return String(item.holder_type).charAt(0) == '2'
                })
            } else {
                orgHolder = []
            }
            if (JSON.stringify(creditData) !== '{}') {
                orgCredit = creditData.recorders.filter(item => {
                    return item.holder_type == '机构';
                })
            } else {
                orgCredit = []
            }

            org = orgHolder.concat(orgCredit);

            let orgClassifyByIdNumber = this.classifyByIdNumber(org);
            let orgFinal = this.recorderData(orgClassifyByIdNumber);

            // 当期机构股东持股总数
            if (data && data.org_amount) {
                orgAmountSum = data.org_amount * 1
            } else {
                for (const item of orgHolder) {
                    orgAmountSum += parseInt(item.holder_amount)
                }
            }

            if (creditData && creditData.org_amount) {
                orgAmountSum += creditData.org_amount * 1;
            } else {
                for (const item of orgCredit) {
                    orgAmountSum += parseInt(item.credit_amount)
                }
            }
            let preOrgHolder, preOrgCredit, preOrg;
            if (preData) {
                preOrgHolder = preData.recorders.filter(item => {
                    return String(item.holder_type).charAt(0) == '2'
                }) // 过滤出上一期机构股东
            } else {
                preOrgHolder = []
            }

            if (preCreditData) {
                let preArr = preCreditData.recorders || [];
                preOrgCredit = preArr.filter(item => {
                    return item.holder_type == '机构';
                })
            } else {
                preOrgCredit = []
            }

            preOrg = preOrgHolder.concat(preOrgCredit);
            let preOrgClassifyByIdNumber = this.classifyByIdNumber(preOrg);
            let preOrgFinal = this.recorderData(preOrgClassifyByIdNumber);

            for (let i = 0; i < orgFinal.length; i++) {
                let preOrgItem = preOrgFinal.find(preObj => {
                    return preObj.account_number ? preObj.account_number == orgFinal[i].account_number : preObj.credit_account == orgFinal[i].credit_account;
                });
                orgFinal[i].index = i + 1;
                orgFinal[i].holder_ratio = getRatio(orgFinal[i].amounts, orgAmountSum, true); // 持有比例
                if (preOrgItem) {
                    orgFinal[i].amount_change = orgFinal[i].amounts - preOrgItem.amounts // 较上期变化
                    orgFinal[i].amount_change_radio = getRatio(orgFinal[i].amount_change, preOrgItem.amounts, true) // 较上期变化率
                } else {
                    orgFinal[i].amount_change = 'new';
                    orgFinal[i].amount_change_radio = '-'
                }
            }
            return orgFinal;
        }
        search(str, orgFinal, type = false) {
            let typeSearchResult = [];
            let changeSearchResult = [];

            if (type) {
                typeSearchResult = orgFinal.filter(item => {
                    return String(item.holder_type).indexOf(type) != -1
                })
            } else {
                typeSearchResult = orgFinal;
            }

            if (str == 'flat') {
                changeSearchResult = orgFinal.filter(item => {
                    return item.amount_change == 0;
                })
            } else if (str == 'up') {
                changeSearchResult = orgFinal.filter(item => {
                    return item.amount_change > 0;
                })
            } else if (str == 'down') {
                changeSearchResult = orgFinal.filter(item => {
                    return item.amount_change < 0;
                })
            } else {
                changeSearchResult = orgFinal.filter(item => {
                    return item.amount_change == 'new'
                })
            }

            function intersect() {
                let sets = [];
                for (let i = 0; i < arguments.length; i++) {
                    const arg = arguments[i];
                    let set = new Set(arg);
                    sets.push(set);
                }
                let result;
                for (let i = 0; i < sets.length - 1; i++) {
                    if (i == 0) {
                        result = [...sets[i]].filter(item => sets[i + 1].has(item));
                    } else {
                        result = [...result].filter(item => sets[i + 1].has(item));
                    }
                }
                return result;
            }
            return intersect(typeSearchResult, changeSearchResult);
        }
        testArrLength(arr, newArr) {
            if (arr.length > 0) {
                arr.forEach(item => {
                    newArr.push({
                        'title': item.holder_name,
                        'count': formatNumber(item.amounts),
                        'ratio': item.holder_ratio,
                        'preCount': formatNumber(item.pre_amount),
                        'countChange': formatNumber(item.amount_change),
                        'ratioChange': item.amount_change_radio
                    })
                });
                newArr.unshift({
                    'title': '机构名称',
                    'count': '持股数量(股)',
                    'ratio': '持股比例(%)',
                    'preCount': '对比期持股数量(股)',
                    'countChange': '变动数量(股)',
                    'ratioChange': '变动比例(%)'
                });
            }
        }
        handleData(holderType = false) {
            let selectPeriod = [curPeriod, prePeriod];
            let allData = getAllData(selectPeriod);
            for (const key in allData) {
                if (allData.hasOwnProperty(key)) {
                    allData[key] = allData[key].sort(sortHolderAmount);
                }
            }

            let mainData = allData[curPeriod];

            if (holderType) {
                mainData = mainData.filter((item) => {
                    return item.holder_type == holderType
                });
            }
            let holder_data = [];
            let compare_tables = [];
            compare_tables.push({
                period: curPeriod,
                data: []
            })
            for (let i = 0; i < mainData.length; i++) {
                let item = mainData[i];
                holder_data.push({
                    key: i,
                    title: item.holder_name,
                    nature: getHolderByType(item.holder_type),
                    id_number: item.id_number
                })
                compare_tables[0].data.push({
                    key: i + 1,
                    rank: i + 1,
                    amount: item.holder_amount,
                    ratio: parseFloat((item.holder_ratio * 1).toFixed(4))
                })
            }
            for (const key in allData) {
                if (allData.hasOwnProperty(key) && selectPeriod.indexOf(key) > -1 && key != selectPeriod[0]) {
                    let item = allData[key];
                    let data = [];
                    for (let i = 0; i < mainData.length; i++) {
                        let record = mainData[i];
                        for (let j = 0; j < item.length; j++) {
                            let pre_record = item[j];
                            if (pre_record.id_number == record.id_number) {
                                data.push({
                                    key: j + 1,
                                    rank: j + 1,
                                    amount: pre_record.holder_amount,
                                    ratio: pre_record.holder_ratio ? parseFloat((pre_record.holder_ratio * 1).toFixed(4)) : 0
                                })
                            }
                        }
                    }
                    compare_tables.splice(1, 0, {
                        period: key,
                        data: data
                    })
                }
            }
            return {
                holderData: holder_data,
                compareTables: compare_tables
            }
        }
        compareAmount(arr1, arr2) { //一一比较俩数组amount是否变化
            let num = 0;
            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i].amount !== arr2[i].amount) {
                    num += 1;
                }
            }
            return num
        }
        compareAmountArr(arr1, arr2, arrName) {
            let arr = [];
            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i].amount !== arr2[i].amount) {
                    let obj = {
                        title: arrName[i].title,
                        nature: arrName[i].nature,
                        count: formatNumber(arr1[i].amount),
                        ratio: arr1[i].ratio,
                        preCount: formatNumber(arr2[i].amount),
                        preRatio: arr2[i].ratio
                    }
                    arr.push(obj)
                }
            }
            return arr
        }

        getSummary(data, preData, creditData, preCreditData) {
            if (!preData) preData = {};
            if (!preCreditData) preCreditData = {};
            if (!creditData) creditData = {};
            let arr = [];
            for (let i = 0; i < 4; i++) {
                if (i == 0) {
                    let obj = {
                        name: "一、股东总体情况",
                        son: []
                    };
                    let basicSituation = {
                        compareStr: this.compareRes(data.total_account, preData.total_account, "户"),
                        count: formatNumber((data.total_account || 0)),
                        preCount: formatNumber((preData.total_account || 0)),
                        change: getChangedRatio(data.total_account, preData && preData.total_account ? preData.total_account : 0, true),
                        avgAmount: parseInt(getSumByPropert(data.recorders, 'holder_amount') / data.recorders.length),
                        preAvgAmount: parseInt(getSumByPropert(preData.recorders, 'holder_amount') / preData.recorders.length)
                    };
                    let compareAverageHold = this.compareRes(basicSituation.avgAmount, basicSituation.preAvgAmount, "股");
                    let yMax01 = Math.max.apply(null, [basicSituation.avgAmount, basicSituation.preAvgAmount]);
                    obj.son.push({
                        name: "1.总户数情况",
                        chartData: {
                            count: [data.total_account, preData.total_account],
                            num: ['     ' + basicSituation.avgAmount, '     ' + basicSituation.preAvgAmount],
                            showYmax: yMax01 * 1.5
                        },
                        describe: [
                            `截止至${REPORT_DATE}，公司股东总户数${basicSituation.count}户，较对比期${basicSituation.compareStr};`,
                            `户均持股${formatNumber(basicSituation.avgAmount)}股，较对比期${compareAverageHold}。`
                        ]
                    })

                    let orgData = {
                        title: '机构股东',
                        count: formatNumber((data.org_account || 0)) + '户',
                        numCompare: this.compareRes(data.org_account, preData.org_account, "户"),
                        holdingTotal: formatNumber(data.org_amount || 0) + '股',
                        ratio: getRatio(data.org_amount, data.total_amount),
                        change: getChangedRatio(data.org_amount, preData && preData.org_amount ? preData.org_amount : 0, true)
                    }
                    let personData = {
                        title: '自然人股东',
                        count: formatNumber((data.personal_account || 0)) + '户',
                        numCompare: this.compareRes(data.personal_account, preData.personal_account, "户"),
                        holdingTotal: formatNumber(data.personal_amount || 0) + '股',
                        ratio: getRatio(data.personal_amount, data.total_amount),
                        change: getChangedRatio(data.personal_amount, preData && preData.personal_amount ? preData.personal_amount : 0, true)
                    }
                    obj.son.push({
                        name: "2.机构和自然人情况",
                        son: null,
                        tableData: [{
                                title: '对比项',
                                count: '本期',
                                preCount: '对比期',
                                change: '变化'
                            },
                            {
                                title: '总户数(户)',
                                count: formatNumber((data.total_account || 0)),
                                preCount: formatNumber((preData.total_account || 0)),
                                change: getChangedRatio(data.total_account, preData && preData.total_account ? preData.total_account : 0, true)
                            },
                            {
                                title: '自然人数(户)',
                                count: formatNumber((data.personal_account || 0)),
                                preCount: formatNumber((preData.personal_account || 0)),
                                change: getChangedRatio(data.personal_account, preData && preData.personal_account ? preData.personal_account : 0, true)
                            },
                            {
                                title: '机构数(户)',
                                count: formatNumber((data.org_account || 0)),
                                preCount: formatNumber((preData.org_account || 0)),
                                change: getChangedRatio(data.org_account, preData && preData.org_account ? preData.org_account : 0, true)
                            },
                            {
                                title: '自然人持股数量',
                                count: formatNumber(data.personal_amount || 0),
                                preCount: formatNumber((preData.personal_amount || 0)),
                                change: getChangedRatio(data.personal_amount, preData && preData.personal_amount ? preData.personal_amount : 0, true)
                            },
                            {
                                title: '机构持股数量',
                                count: formatNumber(data.org_amount || 0),
                                preCount: formatNumber((preData.org_amount || 0)),
                                change: getChangedRatio(data.org_amount, preData && preData.org_amount ? preData.org_amount : 0, true),
                            },
                            {
                                title: '自然人股东持股比例',
                                count: getRatio(data.personal_amount, data.total_amount),
                                preCount: getRatio(preData.personal_amount, preData.total_amount),
                                change: getChangedRatio(data.personal_amount, preData && preData.personal_amount ? preData.personal_amount : 0, true)
                            },
                            {
                                title: '机构股东持股比例',
                                count: getRatio(data.org_amount, data.total_amount),
                                preCount: getRatio(preData.org_amount, preData.total_amount),
                                change: getChangedRatio(data.org_amount, preData && preData.org_amount ? preData.org_amount : 0, true)
                            }
                        ],
                        describe: [
                            `机构股东${orgData.count}，较对比期${orgData.numCompare};`,
                            `机构股东持有${orgData.holdingTotal}，持股比例为${orgData.ratio}，${this.compareRatio(orgData.change)}。`,
                            `自然人股东${personData.count}，较对比期${personData.numCompare};`,
                            `自然人股东持有${personData.holdingTotal}，持股比例为${personData.ratio}，${this.compareRatio(personData.change)}。`,
                        ]
                    })

                    // 计算当期信用股东数、持股数，如果普通数据结果没有，则用信用结果填充
                    let credit_account = data.credit_account;
                    let credit_amount = data.credit_amount;
                    if (!credit_account && creditData.recorders) {
                        credit_account = creditData.recorders.length;
                        for (let r of creditData.recorders) {
                            credit_amount += parseInt(r.credit_amount);
                        }
                    }
                    // 计算上期信用股东数、持股数，如果普通数据结果没有，则用信用结果填充
                    let pre_credit_account = preData.credit_account;
                    let pre_credit_amount = preData.credit_amount;
                    if (!pre_credit_account && preCreditData.recorders) {
                        pre_credit_account = preCreditData.recorders.length;
                        for (let r of preCreditData.recorders) {
                            pre_credit_amount += parseInt(r.credit_amount);
                        }
                    }
                    let crediterData = {
                        title: '信用股东持股',
                        count: formatNumber(credit_amount),
                        ratio: getRatio(credit_amount, data.total_amount),
                        change: getChangedRatio(credit_amount, pre_credit_amount, true),
                        num: formatNumber((credit_account || 0)),
                    }
                    let personAverageHold = parseFloat(((credit_amount / crediterData.num) * 1).toFixed(2));
                    let yMax02 = Math.max.apply(null, [credit_account, pre_credit_account]);
                    obj.son.push({
                        name: "3.信用持股情况",
                        chartData: {
                            count: [credit_amount, pre_credit_amount],
                            num: ['     ' + credit_account, '     ' + pre_credit_account],
                            showYmax: yMax02 * 1.5
                        },
                        describe: [
                            `本期信用持股总股数为${crediterData.count}股，占总股数比例为${crediterData.ratio}，${this.compareRatio(crediterData.change)};`,
                            `信用持股人数为${crediterData.num}人，人均信用持股${formatNumber(personAverageHold)}股。`,
                        ]
                    });
                    let intervalArr = [10, 20, 30, 50, 100];
                    let prepareTableD = [{
                        'title': '股东类名称',
                        'count': '本期持股数量(股)',
                        'countChange': '变动数量(股)',
                        'ratio': '持股比例(%)',
                        'ratioChange': '比例变动(%)'
                    }];
                    intervalArr.forEach(item => {
                        let obj = this.getTopNum(item, data, preData, creditData);
                        prepareTableD.push({
                            'title': obj.name,
                            'count': formatNumber(obj.count),
                            'countChange': formatNumber(obj.change_count),
                            'ratio': parseFloat(parseFloat(obj.ratio).toFixed(2)),
                            'ratioChange': obj.change_ratio
                        })
                    });
                    let obj5 = this.getTopNum(100, data, preData, creditData);
                    obj.son.push({
                        name: "4.集中度情况",
                        son: null,
                        tableData: prepareTableD,
                        describe: [
                            `其中${obj5.name}合计持有${formatNumber(obj5.count)}股，持股比例为${this.toPercent(obj5.ratio)}，${this.compareRatio((obj5.change_ratio).toFixed(2) + "%")}。`
                        ]
                    })
                    arr.push(obj)
                } else if (i == 1) {
                    let obj = {
                        name: "二、股东结构",
                        son: []
                    };
                    const getLevel = function (level) {
                        let ret = '';
                        switch (level) {
                            case 'level1':
                                ret = '1亿股以上'
                                break;
                            case 'level2':
                                ret = '1000万股~1亿股'
                                break;
                            case 'level3':
                                ret = '100万股~1000万股'
                                break;
                            case 'level4':
                                ret = '50万股~100万股'
                                break;
                            case 'level5':
                                ret = '10万股~50万股'
                                break;
                            case 'level6':
                                ret = '10万股'
                                break;
                            default:
                                break;
                        }
                        return ret;
                    }
                    // 把股东性质 整理后的数据放在这里
                    let typeData = [];
                    let levelData = [];
                    // 根据股东性质分类
                    let typeDatas = {};
                    let levelDatas = {
                        level1: [],
                        level2: [],
                        level3: [],
                        level4: [],
                        level5: [],
                        level6: [],
                    };
                    if (data && data.recorders) {
                        for (let i = 0; i < data.recorders.length; i++) {
                            let d = data.recorders[i];
                            d.holder_type = d.holder_type.toString();
                            d.holder_amount = parseInt(d.holder_amount);
                            d.holder_ratio = parseFloat((d.holder_ratio * 1).toFixed(2))
                            // 普通股数量
                            d.normal_amount = parseInt(d.normal_amount || 0);
                            d.credit_amount = parseInt(d.credit_amount || 0);
                            if (typeDatas.hasOwnProperty(d.holder_type)) {
                                typeDatas[d.holder_type].push(d);
                            } else {
                                typeDatas[d.holder_type] = [d];
                            }
                            if (d.holder_amount > Math.pow(10, 8)) {
                                levelDatas.level1.push(d)
                            } else if (d.holder_amount <= Math.pow(10, 8) && d.holder_amount > Math.pow(10, 7)) {
                                levelDatas.level2.push(d)
                            } else if (d.holder_amount <= Math.pow(10, 7) && d.holder_amount > Math.pow(10, 6)) {
                                levelDatas.level3.push(d)
                            } else if (d.holder_amount <= Math.pow(10, 6) && d.holder_amount > 5 * Math.pow(10, 5)) {
                                levelDatas.level4.push(d)
                            } else if (d.holder_amount <= 5 * Math.pow(10, 5) && d.holder_amount > Math.pow(10, 5)) {
                                levelDatas.level5.push(d)
                            } else {
                                levelDatas.level6.push(d)
                            }
                        }
                    }
                    // 把上期的数据加进去
                    if (preData && preData.recorders) {
                        for (let i = 0; i < preData.recorders.length; i++) {
                            let d = preData.recorders[i];
                            d.holder_amount = parseInt(d.holder_amount)
                            d.holder_ratio = parseFloat((d.holder_ratio * 1).toFixed(2))
                            for (const t in typeDatas) {
                                if (typeDatas.hasOwnProperty(t)) {
                                    let element = typeDatas[t];
                                    for (let j = 0; j < element.length; j++) {
                                        let r = element[j];
                                        if (r.id_number == d.id_number) {
                                            r.pre_amount = d.holder_amount;
                                            r.pre_ratio = d.holder_ratio
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // 信用股
                    if (creditData && creditData.recorders) {
                        for (let i = 0; i < creditData.recorders.length; i++) {
                            let d = creditData.recorders[i];
                            for (const t in typeDatas) {
                                if (typeDatas.hasOwnProperty(t)) {
                                    let element = typeDatas[t];
                                    for (let j = 0; j < element.length; j++) {
                                        let r = element[j];
                                        if (r.id_number == d.id_number) {
                                            r.credit_amount = d.credit_amount;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (const key in typeDatas) {
                        if (typeDatas.hasOwnProperty(key)) {
                            const d = typeDatas[key];
                            let item = {
                                key: key,
                                typeName: getHolderByType(key),
                                count: d.length,
                                holder_amount: getSumByPropert(d, 'holder_amount'),
                                pre_amount: getSumByPropert(d, 'pre_amount'),
                                pre_ratio: getSumByPropert(d, 'pre_ratio'),
                                holder_ratio: getSumByPropert(d, 'holder_ratio', true),
                                credit_amount: getSumByPropert(d, 'credit_amount'),
                                normal_amount: getSumByPropert(d, 'normal_amount'),
                            }
                            item.change_amount = item.pre_amount ? item.holder_amount - item.pre_amount : '--';
                            item.change_ratio = item.pre_amount ? getRatio(item.change_amount, item.pre_amount) : '--';
                            typeData.push(item)
                        }
                    }
                    for (const level in levelDatas) {
                        if (levelDatas.hasOwnProperty(level)) {
                            let d = levelDatas[level];
                            let item = {
                                key: level,
                                level: level,
                                levelName: getLevel(level),
                                count: d.length,
                                holder_amount: getSumByPropert(d, 'holder_amount'),
                                pre_amount: getSumByPropert(d, 'pre_amount'),
                                pre_ratio: getSumByPropert(d, 'pre_ratio', true),
                                holder_ratio: getSumByPropert(d, 'holder_ratio', true),
                                credit_amount: getSumByPropert(d, 'credit_amount'),
                                normal_amount: getSumByPropert(d, 'normal_amount'),
                            }
                            item.change_amount = item.pre_amount ? item.holder_amount - item.pre_amount : '--';
                            item.change_ratio = item.pre_amount ? getRatio(item.change_amount, item.pre_amount) : '--';
                            levelData.push(item)
                        }
                    }
                    let prepareTableD = [];
                    let totalObj = {
                        'title': '合计',
                        'count': 0,
                        'holderCount': 0,
                        'ratio': 0,
                        'ratioChange': 0,
                        'creditCount': 0
                    };
                    typeData.forEach(item => {
                        totalObj.count += item.count;
                        totalObj.holderCount += item.holder_amount;
                        totalObj.ratio += item.holder_ratio;
                        totalObj.ratioChange += this.toNumPoint(item.change_ratio);
                        totalObj.creditCount += item.credit_amount;
                        prepareTableD.push({
                            'title': item.typeName,
                            'count': formatNumber(item.count),
                            'holderCount': formatNumber(item.holder_amount),
                            'ratio': parseFloat(item.holder_ratio.toFixed(2)),
                            'ratioChange': item.change_ratio,
                            'creditCount': formatNumber(item.credit_amount)
                        });
                    });
                    totalObj.count = formatNumber(totalObj.count);
                    totalObj.holderCount = formatNumber(totalObj.holderCount);
                    totalObj.ratio = parseFloat( totalObj.ratio.toFixed(2));
                    totalObj.creditCount = formatNumber(totalObj.creditCount);
                    totalObj.ratioChange = totalObj.ratioChange + '%';
                    prepareTableD.push(totalObj);
                    prepareTableD.unshift({
                        'title': '股东性质',
                        'count': '股东数量(个)',
                        'holderCount': '持股数量(股)',
                        'ratio': '持股比例(%)',
                        'ratioChange': '环比(%)',
                        'creditCount': '信用持股数量(股)'
                    });
                    obj.son.push({
                        name: "1.股东构成情况",
                        rowCount: prepareTableD.length,
                        tableData: prepareTableD,
                        describe: []
                    })
                    typeData.forEach(item => {
                        let str;
                        str = `${item.count}个${item.typeName}股东合计持有${formatNumber(item.holder_amount)}股，持股比例为${this.toPercent(item.holder_ratio)}，${this.compareRatio(item.change_ratio)}；`
                        obj.son[0].describe.push(str)
                    })
                    obj.son[0].describe.unshift(`截止至${REPORT_DATE}，公司股东持有${totalObj.holderCount}股，持股比例为${this.toPercent(totalObj.ratio)}，${this.compareRatio(totalObj.ratioChange)}。`)

                    let countMax = [];
                    let amountMax = [];
                    levelData.forEach((item, index) => {
                        countMax.push(item.count);
                        amountMax.push(item.holder_amount);
                    });
                    let tarMax01 = Math.max.apply(null, countMax);
                    let tarMax02 = Math.max.apply(null, amountMax);
                    let str01 = '';
                    let str02 = '';
                    levelData.forEach((item, index) => {
                        if (item.count == tarMax01) {
                            str01 = item.levelName
                        };
                        if (item.holder_amount == tarMax02) {
                            str02 = item.levelName
                        };
                    });
                    let prepareTableDt = [{
                        'title': '分类',
                        'count': '股东数量(个)',
                        'holderCount': '持股数量(股)',
                        'ratio': '持股比例(%)',
                        'ratioChange': '环比(%)',
                        'creditCount': '信用持股数量(股)'
                    }];
                    let chartCount = [];
                    let chartRatio = [];
                    levelData.forEach(item => {
                        prepareTableDt.push({
                            'title': item.levelName,
                            'count': formatNumber(item.count),
                            'holderCount': formatNumber(item.holder_amount),
                            'ratio': item.holder_ratio ? item.holder_ratio : item.holder_ratio + '',
                            'ratioChange': item.change_ratio,
                            'creditCount': formatNumber(item.credit_amount)
                        })
                        chartCount.push(item.count);
                        chartRatio.push('     ' + item.holder_ratio);
                    });
                    // 暂时不需要这个
                    // obj.son.push({
                    //     name:"2.股东持股分布",
                    //     tableData: prepareTableDt,
                    //     chartData:{ count:chartCount, num:chartRatio, showYmax: null },
                    //     describe:[
                    //         `其中，以持有“${str01}”的股东数量最多，持有“${str02}”的股东持股数量最多。`
                    //     ]
                    // })
                    arr.push(obj)
                } else if (i == 2) {
                    let obj = {
                        name: "三、股东持股变化情况",
                        son: []
                    };
                    let data01 = this.getTopNum(10, data, preData, creditData);
                    let sortArr = this.getTopTen(preData, data, preCreditData, creditData);
                    let prepareTableDt = [{
                        'title': '股东名称',
                        'count': '持股数量(股)',
                        'ratio': '持股比例(%)',
                        'preCount': '对比期持股数量(股)',
                        'countChange': '持股变动数(股)',
                        'ratioChange': '比例变动(%)'
                    }];
                    let topTen = sortArr.slice(0, 10);
                    topTen.forEach(item => {
                        prepareTableDt.push({
                            'title': item.holder_name,
                            'count': formatNumber(item.holder_amount),
                            'ratio': parseFloat(item.holder_ratio.toFixed(2)),
                            'preCount': formatNumber(item.pre_amount),
                            'countChange': item.change_amount ? item.change_amount : item.change_amount + '',
                            'ratioChange': item.change_ratio.toFixed(2)
                        })
                    });

                    obj.son.push({
                        name: "1.前10名股东持股变化情况",
                        son: null,
                        rowCount: prepareTableDt.length,
                        tableData: prepareTableDt,
                        describe: [
                            `截止至${REPORT_DATE}，公司前10大股东合计持有${formatNumber(data01.count)}股，持股比例为${this.toPercent(data01.ratio)};`,
                            `前10大股东较该股东在对比期的持股数据，合计${this.compareRatio(this.toPercent(data01.change_ratio))}。`
                        ]
                    })

                    let orgFinal = this.handleListData(data, preData, creditData, preCreditData);

                    let newOrgArr = this.search('new', orgFinal);
                    let orgHolderNew = [];
                    this.testArrLength(newOrgArr, orgHolderNew);

                    let upOrgArr = this.search('up', orgFinal);
                    let orgHolderAdd = [];
                    this.testArrLength(upOrgArr, orgHolderAdd);

                    let downOrgArr = this.search('down', orgFinal);
                    let orgHolderDown = [];
                    this.testArrLength(downOrgArr, orgHolderDown);

                    let newPersonArr = this.search('new', orgFinal, '1000');
                    let personHolderNew = [];
                    this.testArrLength(newPersonArr, personHolderNew);

                    let upPersonArr = this.search('up', orgFinal, '1000');
                    let personHolderAdd = [];
                    this.testArrLength(upPersonArr, personHolderAdd);

                    let downPersonArr = this.search('down', orgFinal, '1000');
                    let personHolderDown = [];
                    this.testArrLength(downPersonArr, personHolderDown);

                    let sonArray01 = [{
                            name: "(1)机构股东增持情况",
                            showTable: upOrgArr.length > 0 ? true : false,
                            rowCount: orgHolderAdd.length,
                            tableData: orgHolderAdd,
                            describe: [`本期${this.retStr(upOrgArr.length, "增持", "机构股东")}。`]
                        },
                        {
                            name: "(2)机构股东减持情况",
                            showTable: downOrgArr.length > 0 ? true : false,
                            rowCount: orgHolderDown.length,
                            tableData: orgHolderDown,
                            describe: [`本期${this.retStr(downOrgArr.length, "减持", "机构股东")}。`]
                        },
                        {
                            name: "(3)新进机构股东持股情况",
                            showTable: newOrgArr.length > 0 ? true : false,
                            rowCount: orgHolderNew.length,
                            tableData: orgHolderNew,
                            describe: [`本期${this.retStr(newOrgArr.length, "新进", "机构股东")}。`]
                        }
                    ];

                    obj.son.push({
                        name: "2.机构股东持股变化情况",
                        son: sonArray01,
                        describe: [
                            `本期股东中${this.retStr(upOrgArr.length, "增持", "机构股东")}，${this.retStr(newOrgArr.length, "新进", "机构股东")}，${this.retStr(downOrgArr.length, "减持", "机构股东")}。`,
                        ]
                    })
                    let sonArray02 = [{
                            name: "(1)自然人增持情况",
                            showTable: upPersonArr.length > 0 ? true : false,
                            rowCount: personHolderAdd.length,
                            tableData: personHolderAdd,
                            describe: [`本期${this.retStr(upPersonArr.length, "增持", "自然人")}。`]
                        },
                        {
                            name: "(2)自然人减持情况",
                            showTable: downPersonArr.length > 0 ? true : false,
                            rowCount: personHolderDown.length,
                            tableData: personHolderDown,
                            describe: [`本期${this.retStr(downPersonArr.length, "减持", "自然人")}。`]
                        },
                        {
                            name: "(3)新进自然人持股情况",
                            showTable: newPersonArr.length > 0 ? true : false,
                            rowCount: personHolderNew.length,
                            tableData: personHolderNew,
                            describe: [`本期${this.retStr(newPersonArr.length, "新进", "自然人")}。`]
                        }
                    ]
                    obj.son.push({
                        name: "3.自然人股东持股变化情况",
                        son: sonArray02,
                        describe: [
                            `本期股东中${this.retStr(upPersonArr.length, "增持", "自然人")}，${this.retStr(newPersonArr.length, "新进", "自然人")}，${this.retStr(downPersonArr.length, "减持", "自然人")}。`,
                        ]
                    })
                    arr.push(obj)
                } else if (i == 3) {
                    let obj = {
                        name: "四、重要股东变化情况",
                        son: []
                    }
                    //基金判断变化，判断持股数量是否变化, 是否显示表格字段
                    let found = ['2001', '2101', '2201', '2002', '2102', '2202'];
                    let holderData = [];
                    let compareTables = [];
                    found.forEach(item => {
                        let obj = this.handleData(item); //{ holderData: holder_data, compareTables: compare_tables }
                        if (obj.holderData.length > 0) {
                            holderData = holderData.concat(obj.holderData);
                            if (obj.compareTables[0].data.length != obj.compareTables[1].data.length) {
                                let len = Math.max.apply(null, [obj.compareTables[0].data.length, obj.compareTables[1].data.length]);
                                for (let j = 0; j < len; j++) {
                                    if (!obj.compareTables[0].data[j]) {
                                        let addObj = {
                                            amount: 0,
                                            ratio: "0"
                                        };
                                        obj.compareTables[0].data.push(addObj)
                                    };
                                    if (!obj.compareTables[1].data[j]) {
                                        let addObj = {
                                            amount: 0,
                                            ratio: "0"
                                        };
                                        obj.compareTables[1].data.push(addObj)
                                    };
                                }
                            };
                            compareTables = compareTables.concat(obj.compareTables);
                        }
                    });
                    let isChange = null
                    if (compareTables.length) {
                        isChange = this.compareAmount(compareTables[0].data, compareTables[1].data);
                    }
                    let fundtableData = [];
                    if (isChange) {
                        fundtableData = this.compareAmountArr(compareTables[0].data, compareTables[1].data, holderData);
                        fundtableData.unshift({
                            'title': '基金名称',
                            'nature': '基金性质',
                            'count': '持股数量(股)',
                            'ratio': '持股比例(%)',
                            'preCount': '对比期持股数量(股)',
                            'preRatio': '对比期持股比例(%)'
                        })
                    };
                    obj.son.push({
                        name: "1.基金持股变化情况",
                        showTable: isChange ? true : false,
                        rowCount: isChange + 1,
                        tableData: fundtableData,
                        describe: isChange ? [`本期有${isChange}家基金持股变化情况。`] : [`本期无基金持股变化情况。`]
                    });
                    //社保基金持股变化， 含"全国社保基金"文字则为社保基金股东
                    let fundObj = this.handleData(); //{ holderData: [n家股东], compareTables: [{20180523}, {20180422}] }
                    fundObj.holderData.forEach((item, index) => {
                        if (item.title.indexOf("全国社保基金") == -1) {
                            fundObj.holderData.splice(index, 1);
                            fundObj.compareTables[0].data.splice(index, 1);
                            fundObj.compareTables[1].data.splice(index, 1);
                        }
                    });
                    let hasChange = this.compareAmount(fundObj.compareTables[0].data, fundObj.compareTables[1].data);
                    let socialFundtableData = [];
                    if (hasChange) {
                        socialFundtableData = this.compareAmountArr(fundObj.compareTables[0].data, fundObj.compareTables[1].data, fundObj.holderData);
                        socialFundtableData.unshift({
                            'title': '基金名称',
                            'nature': '基金性质',
                            'count': '持股数量(股)',
                            'ratio': '持股比例(%)',
                            'preCount': '对比期持股数量(股)',
                            'preRatio': '对比期持股比例(%)'
                        })
                    };
                    obj.son.push({
                        name: "2.社保基金持股变化情况",
                        showTable: hasChange ? true : false,
                        rowCount: hasChange + 1,
                        tableData: socialFundtableData,
                        describe: hasChange ? [`本期有${hasChange}家社保基金持股变化情况。`] : [`本期无社保基金持股变化情况。`]
                    });

                    let goldenObj = this.handleData();
                    goldenObj.holderData.forEach((item, index) => {
                        if (item.title !== '中国证券金融股份有限公司' && item.title !== '中央汇金资产管理有限责任公司') { //证金公司
                            goldenObj.holderData.splice(index, 1);
                            goldenObj.compareTables[0].data.splice(index, 1);
                            goldenObj.compareTables[1].data.splice(index, 1);
                        }
                    });
                    let yesChange = this.compareAmount(goldenObj.compareTables[0].data, goldenObj.compareTables[1].data);
                    let yesTableData = [];
                    if (yesChange) {
                        yesTableData = this.compareAmountArr(goldenObj.compareTables[0].data, goldenObj.compareTables[1].data, goldenObj.holderData);
                        yesTableData.unshift({
                            'title': '股东名称',
                            'nature': '股东性质',
                            'count': '持股数量(股)',
                            'ratio': '持股比例(%)',
                            'preCount': '对比期持股数量(股)',
                            'preRatio': '对比期持股比例(%)'
                        })
                    };
                    obj.son.push({
                        name: "3.证金公司和汇金公司持股变化情况",
                        showTable: yesChange ? true : false,
                        rowCount: yesChange + 1,
                        tableData: yesTableData,
                        describe: yesChange ? [`本期有${yesChange}家证金公司和汇金公司持股变化情况。`] : [`本期无证金公司和汇金公司持股变化情况。`]
                    })

                    arr.push(obj)
                }
            }
            return arr
        }
    }

    const documentCreator = new DocumentCreator();
    const doc = documentCreator.create(data, preData, creditData, preCreditData)
    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync(path + "\\" + "股东持股分析报告" + curPeriod + "&" + prePeriod + ".docx", buffer);
        setTimeout(function () {
            callback && callback(null)
        }, 2000)
    }).catch(function (err) {
        callback && callback(err)
    })

}
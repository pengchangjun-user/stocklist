

import React, { useState, useEffect } from "react"
import { Tabs } from 'antd'
import Compare from "../compare/compare"
import Search from "../search/search"
import CreditStockAnalyze from "../creditStockAnalyze/creditStockAnalyze"
import OrgStockAnalyze from "../orgStockAnalyze/orgStockAnalyze"
import DataManage from "../dataManage/dataManage"
import appGlobal from "../../global/global"
import "./main.scss"

const { TabPane } = Tabs


const Main = () => {
    const [ current, setCurrent ] = useState(appGlobal.currentKey ? appGlobal.currentKey : "1")
  
    const tabChange = (key) => {
        setCurrent(key)
        appGlobal.currentKey = key
    }

    return (
        <div className="main">
            <Tabs activeKey={current} onChange={tabChange} tabBarGutter={15}>
                <TabPane tab="股东数据对比" key="1">
                    {
                        current === "1" ? <div style={{height: "100%"}}><Compare /></div> : <div></div>
                    }
                </TabPane>
                <TabPane tab="机构股东分析" key="2">
                    {
                        current === "2" ? <OrgStockAnalyze /> : <div></div>
                    }
                </TabPane>
                <TabPane tab="信用股东分析" key="3">
                    {
                        current === "3" ? <CreditStockAnalyze /> : <div></div>
                    }
                </TabPane>
                <TabPane tab="股东检索" key="4">
                    {
                        current === "4" ? <Search /> : <div></div>
                    }
                </TabPane>
                <TabPane tab="股东数据管理" key="5">
                    {
                        current === "5" ? <DataManage /> : <div></div>
                    }
                </TabPane>
            </Tabs>
        </div>
    )
}

export default Main